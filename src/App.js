import React, {Component} from 'react';
import axios from 'axios';
import moment from 'moment';
import './App.css';
// import env from 'dotenv';

import {withStyles} from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import IntegrationAutosuggest from './AutoSuggest';


import logo from './icon_slack.png';
import APIs from './const/API';
const env = require('dotenv').config();

const slack_token = process.env.REACT_APP_SLACKTOKEN;
console.log(process.env);


// console.loz

const CustomTableCell = withStyles(theme => ({
    head: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    body: {
        fontSize: 14,
    },
}))(TableCell);


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            messages: [],
            users: null,
            channels: null,
            suggestions: []
        };
    }

    componentDidMount() {
        axios.get(APIs.slack.slack_users + "?token="+slack_token)
            .then(response => {
                this.setState({
                    users: response.data.members
                })
            });

        axios.get(APIs.slack.slack_channels + "?token="+slack_token)
            .then(response => {
                this.setState({
                    channels: response.data.channels
                }, () => console.log(this.state.channels))
            })
    }

    getMessages = (response) => {
        response.data.map(message => {
            let username = this.state.users.find(user => user.id === message.sender_Id).name;
            let channel = this.state.channels.find(channel => channel.id === message.channel_Id).name;
            let messageInfo = {
                message_Id: message.message_id,
                message: message.message,
                username: username,
                timestamp: message.timestamp,
                channel: channel
            };
            this.setState({
                messages: [...this.state.messages, messageInfo]
            }, () => console.log(this.state.messages))
        })
    };


    handleSubmit = (searchTerm) => {
        this.setState({
            messages: [],
            value: searchTerm
        },() => {
            switch (this.state.value) {
                case ("@" + this.state.value.slice(1)):
                    let username = this.state.value.slice(1).toLocaleLowerCase();
                    let sender_Id = this.state.users.find(user => user.name === username).id;
                    console.log(sender_Id);
                    axios.get(APIs.aws.base_url + "/chats?text=@" + sender_Id)
                        .then(response => {
                            if (response.data.length === 0) {
                                console.log("No record found");
                            }
                            this.getMessages(response);
                        })
                        .catch(err => {
                            console.log(err);
                            this.setState({
                                messages: []
                            })
                        });
                    break;
                case ("#" + this.state.value.slice(1)):
                    let channelName = this.state.value.slice(1).toLocaleLowerCase();
                    let channel_Id = this.state.channels.find(channel => channel.name === channelName).id;
                    axios.get(APIs.aws.base_url + "/chats?text=_" + channel_Id)
                        .then(response => {
                            if (response.data.length === 0) {
                                console.log("No record found");
                            }
                            this.getMessages(response)
                        })
                        .catch(err => {
                            console.log(err);
                            this.setState({
                                messages: []
                            })
                        });
                    break;
                default:
                    axios.get(APIs.aws.base_url + "/chats?text=" + this.state.value.toLocaleLowerCase())
                        .then(response => {
                            if (response.data.length === 0) {
                                console.log("No record found");
                            }
                            this.getMessages(response)
                        })
                        .catch(err => {
                            console.log(err);
                            this.setState({
                                messages: []
                            })
                        });
                    break;
            }
        });


    };


    render() {
        const { value } = this.state;


        const table = (
            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <CustomTableCell>Message</CustomTableCell>
                            <CustomTableCell align="center">Sender</CustomTableCell>
                            <CustomTableCell align="center">Channel</CustomTableCell>
                            <CustomTableCell align="center">Timestamp</CustomTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state.messages.map(row => {
                            return (
                                <TableRow key={row.message_id}>
                                    <CustomTableCell component="th" scope="row">
                                        {row.message}
                                    </CustomTableCell>
                                    <CustomTableCell align="center">{row.username}</CustomTableCell>
                                    <CustomTableCell align="center">{row.channel}</CustomTableCell>
                                    <CustomTableCell
                                        align="center">{moment.unix(row.timestamp).format('MMMM Do YYYY, h:mm:ss a')}</CustomTableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>
        );

        return (
            <div className="App">
                <header className="App-header">
                    <IntegrationAutosuggest searchQuery={this.handleSubmit}/>
                    <img src={logo} width={40} height={40} className="Logo-styles" alt=""/>
                </header>
                <div>
                    {table}
                </div>
            </div>
        );
    }
}


export default App;
