const url = 'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1';

let i = 0;

$(document).ready(function() {
  $.ajaxSetup({ cache: false });
  $("#get-quote").on("click", getQuote)
});

function getQuote() {

  $.getJSON(url, function(a) {
      $("#quote-text").html(`${a[0].content}`);
      $("#quote-author").html(`&mdash; ${a[0].title}`);
  });
}
