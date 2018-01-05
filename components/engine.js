/*
*  Turn plain text into DOM objects.
*  This is because commonmark seems to only return text.
*/
var text_to_DOM = function(text) {
  var nonce_parent = document.createElement("div");
  nonce_parent.innerHTML = text;
  return nonce_parent.childNodes;
};


var ast_to_DOM = function(ast_obj, writer) {

  /* Turn into DOM objects */
  var div = document.createElement("div");
  div.innerHTML = writer.render(ast_obj);
  return div;
};


var shrink_away = function(obj) {
  obj.style.visibility = "collapse";
  obj.style.height = "0.1ex";
};


/*
*  Split on --- which would render to <thematic_break />
*  in the AST
*/
var split_on_triple_dash = function(text) {
  return text.split(/\n+---\n+/m);
};

// /* Embarassing unit test */
// (function() {
//   var test_split_on_triple_dash = function() {
//     if (_.isEqual(split_on_triple_dash("abc").sort(), ["abc"].sort())) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc---def"), ["abc---def"])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n---\ndef"), ["abc", "def"])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n\n---\ndef"), ["abc", "def"])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n\n---\n\ndef"), ["abc", "def"])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n---\n\ndef"), ["abc", "def"])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n---\n\ndef\n"), ["abc", "def\n"])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n---\n\ndef\n\n"), ["abc", "def\n\n"])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n---\n\ndef\n\n---"), ["abc", "def\n\n---"])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n---\n\ndef\n\n---\n"), ["abc", "def", ""])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n---\n\ndef\n\n---\n\n"), ["abc", "def", ""])) {results.pass++} else {results.fail++};
//     if (_.isEqual(split_on_triple_dash("abc\n---\n\ndef\n\n---\n\nghi"), ["abc", "def", "ghi"])) {results.pass++} else {results.fail++};
//   };
// 
// 
//   results = {
//     pass: 0,
//     fail: 0
//   };
// 
//   test_split_on_triple_dash();
//   console.log(results);
// })();


var separate_metadata = function(text) {
  var lines = text.split("\n");
  var metadata = [];
  var the_rest = [];
  var top = true;
  for (var i = 0; i < lines.length; i++) {
    var cur_line = lines[i];
    if (top) {
      if (cur_line.match(/^% /)) {
        metadata.push(cur_line.replace(/^% /,""));
      }
      else {
        the_rest.push(cur_line);
        top = false;
      }
    }
    else {
      the_rest.push(cur_line);
    }
  }

  /* Only include metadata if it was valid JSON */
  try {
    metadata = JSON.parse(metadata.join("\n"));
  }
  catch(e) {
    metadata = null;
  }
  return {"metadata": metadata, "text": the_rest.join("\n")};
};


function getAnchorVariable(variable) {
  var query = window.location.hash.substring(1);
  var vars = query.split("&");
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable){
      return pair[1];
    }
  }
  return(false);
}


requested_slug = function() {
  var to_return = getAnchorVariable("slug");
  if (to_return) {
    return to_return;
  }
  return null;
};


rendered_from_slug = function(pages, slug) {
  if (pages !== null) {
    if (pages.hasOwnProperty(slug)) {
      if (pages[slug] !== null &&
          pages[slug].hasOwnProperty("rendered")
      ) {
        return pages[slug]["rendered"];
      }
    }

    /* If it's a dynamic page, render that */
    else {
      if (pages.hasOwnProperty("dynamic_pages")
          && pages["dynamic_pages"].hasOwnProperty(slug)) {
        return pages["dynamic_pages"][slug]();
      }
    }
  }
  return null;
};


display_front_page = function(pages, body) {
  display_page(pages, "front", body);
};


reserved_slugs = function() {
  return ["dynamic_pages", "front", "header", "footer", "on_every_page", "404"];
};


/* Return a table of contents ul for the slugs in `pages` */
toc = function(pages) {
  var ul = document.createElement("ul");
  ul.className = "toc";
  _.forOwn(pages, function(page, slug) {
    if (!_.includes(reserved_slugs(), slug)) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "?slug=" + slug;
      a.innerHTML = slug;
      li.appendChild(a);
      ul.appendChild(li);
    }
  });
  return ul;
}


/* Basically what a 404 should be like given `slug`
 * is not a registered slug. */
display_nonexistent_page = function(pages, slug, body) {
  if (pages.hasOwnProperty("404") &&
      pages["404"] !== null &&
      pages["404"].hasOwnProperty("rendered")
  ) {
    display_page(pages, "404", body);
  }
  else {
    display_front_page(pages, body);
  }
};


/*
*  Empty `body` and append only the page with slug `slug` and
*  one with "footer" at the bottom.  If no page with slug `slug`
*  exists, display the front page.  If a page with slug "on_every_page"
*  exists, add that one before footer (it's expected you'll heavily
*  style this so it doesn't appear at the bottom like footer).
*/
display_page = function(pages, slug, body) {
  var to_display = rendered_from_slug(pages, slug);
  var header = rendered_from_slug(pages, "header");
  var footer = rendered_from_slug(pages, "footer");
  var oep = rendered_from_slug(pages, "on_every_page");
  if (to_display !== null) {

    /* Empty body */
    while (body.firstChild) {
      body.removeChild(body.firstChild);
    }

    /* Display header if present */
    if (header !== null) {
      body.appendChild(header);
    }

    /* Display the page */
    body.appendChild(to_display);

    /* Display on_every_page if present */
    if (oep !== null) {
      body.appendChild(oep);
    }

    /* Display the footer if present */
    if (footer !== null) {
      body.appendChild(footer);
    }
  }
  else {
    display_nonexistent_page(pages, slug, body);
  }
};




/* Actual page generation */
(function () {

/* Globals that may some day be replaced by localStorage or something */
var pages = {};
var md_container = document.getElementById("main_container");
var mds = split_on_triple_dash(md_container.textContent);


/* Hide the markdown */
shrink_away(md_container);


/*
*  Digest the markdown into divs and metadata
*  chopping up based on --- which renders to <thematic_break />
*
*  Render and store based on "slug" metadata value or which pass
*  through the loop this is.  To avoid conflicts, don't make slugs of
*  the form "page_1".
*  Special values for "slug":
*    - page_<some_int>
*    - anything in the output of `reserved_slugs`
*
*  TODO Someday these can be cached and/or rendered only when needed
*  to avoid upfront work.
*/
var reader = new commonmark.Parser();
var writer = new commonmark.HtmlRenderer();
for (var i = 0; i < mds.length; i++) {
  var separated = separate_metadata(mds[i]);
  var metadata = separated["metadata"];
  var md = separated["text"];
  var rendered = ast_to_DOM(reader.parse(md), writer);
  var index = "page_" + String(i);
  if (metadata !== null && metadata.hasOwnProperty("slug")) {
    index = String(metadata["slug"]);
  }
  rendered.id = "slug_" + index;
	pages[index] = {"metadata": metadata, "rendered":
      rendered, "markdown": md};
}

pages["dynamic_pages"] = {
//"on_every_page": function() {
//  var ul = toc(pages);
//  var lis = ul.children;
//  lis[0].style.marginTop = "3vw";
//  for (var i = 0; i < lis.length - 1; i++) {
//    li = lis[i];
//    li.style.marginBottom = "3vw";
//  }
//  lis[lis.length - 1].style.marginBottom = "3vw";
//  return ul;
//}
};


/* If no page routed, display front page */
if (requested_slug() == null) {
  display_front_page(pages, document.body);
}
else {
  display_page(pages, requested_slug(), document.body);
}


/* Redisplay the main part of the page whenever the
 * # changes */
window.addEventListener("hashchange", function() {
  display_page(pages, requested_slug(), document.body);
}, false);




})();


