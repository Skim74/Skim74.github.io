const url = 'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1';

document.addEventListener("DOMContentLoaded", function(event) {
  document.getElementById("get-quote").addEventListener("click", noJQueryQuote);
});

function noJQueryQuote() {
  let link;
  const request = new XMLHttpRequest();

  request.open('GET', `${url}&t=${new Date().getTime()}`, true);

  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var data = JSON.parse(this.response);
      if (data[0].content.length > 140) {
        noJQueryQuote();
      } else {
        if (data[0].custom_meta) {
          let longlink = data[0].custom_meta.Source;
          link = longlink.substr(0, longlink.indexOf('>') + 1);
        } else {
          link = `<a href="${data[0].link}">`;
        }
        document.getElementById("quote-text").innerHTML = data[0].content;
        document.getElementById("quote-author").innerHTML = `${link} &mdash; ${data[0].title} </a>`;
        document.getElementById("get-quote").innerHTML = 'New Quote';
        document.body.style.background = `#${Math.floor(Math.random()*16777215).toString(16)}`;
      }
    } else {
      console.log('ruh rho');
    }
  };
  request.onerror = function() {
    // There was a connection error of some sort
  };
  request.send();
}
