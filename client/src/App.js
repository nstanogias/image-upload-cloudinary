import React, {Component} from 'react';
import './App.css';
import axios from 'axios';

class App extends Component {


  constructor() {
    super();
    this.state = {
      selectedFile: '',
      error: null,
      fileToShow: null,
      isLoading: false
    };
  }

  onChange = (e) => {
    switch (e.target.name) {
      case 'selectedFile':
        this.setState({selectedFile: e.target.files[0]});
        break;
      default:
        this.setState({[e.target.name]: e.target.value});
    }
  };

  onSubmit = (e) => {
    this.setState({isLoading: true, error: null});
    e.preventDefault();
    const {selectedFile} = this.state;
    let formData = new FormData();
    const config = {
      header: {'content-type':'multipart/form-data'}
    }
    formData.append('selectedFile', selectedFile);
    axios
      .post('/uploadimage', formData, config)
      .then((result) => {
        console.log("result is", result);
        this.setState({fileToShow: result.data.url, isLoading:false});
      })
      .catch(err => {
        console.log(err.response);
          this.setState({error: err.response.data.error, isLoading: false});
      });
  };

  render() {
    const loader = <div className="progress" style={{width: "30%"}}>
                    <div className="indeterminate" ></div>
                  </div>;

    return (
      <div className="container">
        <div className="row">
          <h2 className="center-align">Materialize File Input</h2>
          {this.state.error !== null && <h5 className="center-align red-text">{this.state.error}</h5>}
          <form onSubmit={this.onSubmit}>
            <div className="file-field input-field">
              <div className="btn">
                <span>Browse</span>
                <input type="file" name="selectedFile" onChange={this.onChange}/>
              </div>

              <div className="file-path-wrapper">
                <input className="file-path validate" type="text"
                       placeholder="Upload file"/>
              </div>
            </div>
            <button type="submit" className="btn">Submit</button>
          </form>
        </div>
        <br/>
        {this.state.isLoading && loader}
        {this.state.fileToShow !== null &&
        <img src={this.state.fileToShow} alt="" className="responsive-img"/>
        }
      </div>
    );
  }
}

export default App;
