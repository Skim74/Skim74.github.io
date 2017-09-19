var React = require('react');


class QuoteBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      author: '',
      quote: '',
      quoteLink: '',
      buttonText: 'Generate Quote'
    }
  }

  getQuote() {
    const that=this;
    const url = 'http://quotesondesign.com/wp-json/posts?filter[orderby]=rand&filter[posts_per_page]=1';
    const request = new XMLHttpRequest();

    request.open('GET', `${url}&t=${new Date().getTime()}`, true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        const data = JSON.parse(this.response);
        if(data[0].content.length > 140) {
          that.getQuote();
        } else {

        const link = data[0].custom_meta ?
          data[0].custom_meta.Source.split(/"/)[1]
          : data[0].link;

        that.setState({
          author: `— ${data[0].title}`,
          quote: data[0].content,
          quoteLink: link,
          buttonText: 'New Quote'
        });
      }
    } else {
        console.log('ruh rho');
      }
    };
    request.send();
  }
  componentWillUpdate(nextProps, nextState) {
    document.body.style.background = `#${Math.floor(Math.random()*16777215).toString(16)}`;
  }

  render() {
    return <div>
      <div className="row">
          <div className="col-lg-12 quotebox">
            <center>
            <h3 dangerouslySetInnerHTML={{__html: this.state.quote}}></h3>
            <h4><a href={this.state.quoteLink}>{this.state.author}</a></h4>
            <button onClick={this.getQuote.bind(this)} className="unclicked">
              {this.state.buttonText}
            </button>
            </center>
          </div>
      </div>
    </div>;
  }
}

module.exports = QuoteBox;
