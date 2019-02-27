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
import TextField from "@material-ui/core/TextField/TextField";
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
            suggestions: [],
            fromDate: '',
            toDate: ''
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

    handleFilter = (event) => {
      console.log(event.target.value);
    };


    render() {
        const { value } = this.state;

        const filteredData = this.state.messages.filter(message => message.timestamp >= this.state.fromDate && message.timestamp <= this.state.toDate);
        console.log(filteredData);
        let data;
        if (this.state.toDate === "" && this.state.fromDate === "") {
            data = this.state.messages
        } else {
            data = filteredData
        }

        const table = (
            <Paper>
                <Table>
                    <TableHead>
                        <TableRow>
                            <CustomTableCell>Message</CustomTableCell>
                            <CustomTableCell align="center">Sender</CustomTableCell>
                            <CustomTableCell align="center">Channel</CustomTableCell>
                            <CustomTableCell align="center">
                                Timestamp (Filter with Date)
                                <br/>
                                <div >
                                    <TextField
                                        id="dateFrom"
                                        label="From"
                                        type="date"
                                        onChange={(event) => this.setState({fromDate: new Date(event.target.value).getTime()/1000}, () => console.log(this.state.fromDate))}
                                        // defaultValue= {moment().format("YYYY-MM-DD")}
                                        className="DatePicker"
                                        InputLabelProps={{
                                            shrink: true,
                                            style: {
                                                color: '#fff',
                                                fontSize: 16,
                                                marginLeft: 100
                                            }
                                        }}
                                        inputProps={{
                                            style: {
                                                color: "#fff",
                                                fontSize: 12,
                                                marginLeft: 100
                                            }
                                        }}
                                    />
                                    <TextField
                                        id="dateFrom"
                                        label="To"
                                        type="date"
                                        onChange={(event) => this.setState({toDate: new Date(event.target.value).getTime()/1000}, () => console.log(this.state.toDate))}
                                        // defaultValue= {moment().format("YYYY-MM-DD")}
                                        className="DatePicker"
                                        InputLabelProps={{
                                            shrink: true,
                                            style: {
                                                color: '#fff',
                                                fontSize: 16,
                                                paddingLeft: 10
                                            }
                                        }}
                                        inputProps={{
                                            style: {
                                                color: "#fff",
                                                fontSize: 12,
                                                paddingLeft: 10
                                            },
                                            // value: this.state.fromDate,
                                            // onChange: this.setState({fromDate: value})
                                        }}
                                    />
                                </div>

                            </CustomTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map(row => {
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
