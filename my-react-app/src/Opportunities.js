import './App.css'

class Opportunities extends React.Component {
  
    constructor(props) {
        super(props);
        this.state = {
          value: null,
        };
    }
    
    render() {
        return (
          <button
            className="square"
            onClick={() => this.setState({value: 'X'})}
          >
            {this.state.value}
          </button>
        );
    }
  }