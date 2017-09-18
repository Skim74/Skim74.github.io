const url = 'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1';

$(document).ready(function() {
  $.ajaxSetup({
    cache: false
  });
  $("#get-quote").on("click", getQuote)
});

function getQuote() {
  let link;
  $.getJSON(url, function(a) {
    if (a[0].content.length>140) {
      getQuote();
    } else {
      if (a[0].custom_meta) {
        let longlink = a[0].custom_meta.Source;
        link = longlink.substr(0, longlink.indexOf('>') + 1);
      } else {
        link = `<a href="${a[0].link}">`;
      }
      $("#quote-text").html(`${a[0].content}`);
      $("#quote-author").html(`${link} &mdash; ${a[0].title} </a>`);
      $("#get-quote").text(`New Quote`).removeClass("unclicked");
      $("body").css('background', `#${Math.floor(Math.random()*16777215).toString(16)}`);
    }
  });


}
