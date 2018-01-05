index.html: components/all_styles.css components/commonmark.min.js components/lodash.min.js components/disabled_javascript_blurb.html components/content.md components/engine.js components/skeleton.html
	 sed -e '/<!-- all_styles.css goes here -->/r components/all_styles.css' \
	     -e '/<!-- all_styles.css goes here -->/d' components/skeleton.html \
	|sed -e '/<!-- commonmark.min.js goes here -->/r components/commonmark.min.js' \
	     -e '/<!-- commonmark.min.js goes here -->/d' \
	|sed -e '/<!-- lodash.min.js goes here -->/r components/lodash.min.js' \
	     -e '/<!-- lodash.min.js goes here -->/d' \
	|sed -e '/<!-- disabled_javascript_blurb.html goes here -->/r components/disabled_javascript_blurb.html' \
	     -e '/<!-- disabled_javascript_blurb.html goes here -->/d' \
	|sed -e '/<!-- content.md goes here -->/r components/content.md' \
	     -e '/<!-- content.md goes here -->/d' \
	|sed -e '/<!-- engine.js goes here -->/r components/engine.js' \
	     -e '/<!-- engine.js goes here -->/d' > index.html

clean:
	rm -f index.html
