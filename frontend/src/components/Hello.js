import React, { Component } from 'react'

class Hello extends Component {
    state = {
        name: 'Nizam',
        occupation: 'Web Developer'
    }

    handleClick = (e) => {

    }

    render() {
        return(
            <div>
                <h1>Hello {this.state.name}. I see you are {this.state.occupation}. NOICE </h1>
                <button onClick={ this.handleClick }>Click me</button>
            </div>
        )
    }
}

export default Hello;