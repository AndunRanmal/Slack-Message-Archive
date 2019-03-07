import React, {Component} from 'react';
import axios from 'axios';
import moment from 'moment';
import {Player} from 'video-react';

//Material Ui
import Grid from "@material-ui/core/Grid";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import CloudDownload from '@material-ui/icons/CloudDownload';
import ButtonBase from '@material-ui/core/ButtonBase';
import "./../node_modules/video-react/dist/video-react.css";

import IntegrationAutosuggest from './AutoSuggest';
import './App.css';
import logo from './icon_slack.png';
import slackbot from './Slackbot.png';
import APIs from './const/API';

const env = require('dotenv').config();
const showdown = require("showdown");
const Parser = require('html-react-parser');


const slack_token = process.env.REACT_APP_SLACKTOKEN;
console.log(process.env);

const converter = new showdown.Converter();
let byday = {};


class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            value: '',
            messages: [],
            users: null,
            channels: [],
            suggestions: [],
            fromDate: '',
            toDate: '',
            groups: null,
            sortedMessages: []
        };
    }

    componentDidMount() {
        axios.get(APIs.slack.slack_users + "?token=" + slack_token)
            .then(response => {
                console.log(response);
                this.setState({
                    users: response.data.members
                }, () => () => console.log(this.state.users))
            })
            .catch(err => console.log(err));

        axios.get(APIs.slack.slack_channels + "?token=" + slack_token)
            .then(response => {
                this.setState({
                    channels: response.data.channels
                }, () => console.log(this.state.channels))
            })
            .catch(err => console.log(err));
    }

    getMessages = (response) => {
        let sort = {};
        byday = {};
        response.data.map(message => {
            let username = this.state.users.find(user => user.id === message.sender_Id).name;
            let channel = this.state.channels.find(channel => channel.id === message.channel_Id).name;
            let messageInfo = {
                message_Id: message.message_id,
                message: message.message,
                username: username,
                timestamp: message.timestamp,
                channel: channel,
                files: message.files
            };
            this.setState({
                groups: null,
                messages: [...this.state.messages, messageInfo]
            })
        });
        //sorting messages inside a group
        this.state.messages.map(this.groupday);
        this.setState({
            groups: byday
        }, () => Object.keys(this.state.groups).map(group => {
            this.state.groups[group].sort((a, b) => a.timestamp < b.timestamp? -1 : 1);

            sort[group] = this.state.groups[group];
            console.log(sort);
        }));
        this.setState({
            groups: sort
        })
    };


    handleSubmit = (searchTerm) => {
        this.setState({
            messages: [],
            value: searchTerm,

        }, () => {
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
                    console.log(channelName);
                    let channel_Id = this.state.channels.find(channel => channel.name === channelName).id;
                    axios.get(APIs.aws.base_url + "/chats?text=_" + channel_Id)
                        .then(response => {
                            if (response.data.length === 0) {
                                console.log("No record found");
                            }
                            console.log(response.data);
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



    groupday = (value, index, array) => {
        let d = moment.unix(Number(value.timestamp));
        d = Math.floor(d._d.getTime()/(1000*60*60*24));
        byday[d]=byday[d]||[];
        byday[d].push(value);
        return byday;
    };


    render() {
        const {classes} = this.props;
        const {value} = this.state;
        const active_channels = this.state.channels.filter(channel => channel.is_archived === false);
        const filteredData = this.state.messages.filter(message => message.timestamp >= this.state.fromDate && message.timestamp <= this.state.toDate);
        let data;
        if (this.state.toDate === "" && this.state.fromDate === "") {
            data = this.state.messages
        } else {
            data = filteredData
        }

        return (
            <div className="App">
                <header className="App-header">
                    <IntegrationAutosuggest searchQuery={this.handleSubmit}/>
                    <img src={logo} width={40} height={40} className="Logo-styles" alt=""/>
                </header>
                <div>
                    <Grid container>
                        <Grid item xs={3} className="Channels-container">
                            <div className="Channel-title">
                                <h4> #Channels </h4>
                            </div>
                            <div className="Channel-list">
                                <List>
                                    {
                                        active_channels.map(channel => (
                                            <div>
                                                <ListItem key={value} button
                                                          onClick={() => this.handleSubmit("#" + channel.name)}>
                                                    <ListItemText primary={<Typography style={{
                                                        color: '#fff',
                                                        fontSize: 15,
                                                        fontWeight: "500",
                                                        marginLeft: 10
                                                    }}>#{channel.name}</Typography>}/>
                                                </ListItem>
                                                {/*<Divider light/>*/}
                                            </div>
                                        ))}
                                </List>
                            </div>
                        </Grid>
                        <Grid item xs={9}>
                            <AppBar position="static" style={{ backgroundColor: '#2d162d'}}>
                                <Toolbar>
                                    <IconButton
                                        style={{position: 'absolute', right: 10  }}
                                        aria-haspopup="true"
                                        color="inherit"
                                    >
                                        <InfoIcon/>
                                    </IconButton>
                                    <Typography variant="h6" color="inherit" noWrap>
                                        {this.state.value}
                                    </Typography>
                                    {/*<div className={classes.grow} />*/}

                                </Toolbar>
                            </AppBar>
                            {/*{table}*/}
                            <div className="Message-container">
                                {

                                    this.state.groups !== null ?

                                        Object.keys(this.state.groups).map(group => (
                                            <div>
                                                <h1 className="Message-date">{moment.unix(Number(group)*(60*60*24)).format("dddd MMMM Do YYYY")}</h1>
                                                <div>{

                                                    this.state.groups[group].map(message => (
                                                        <div className="Message-row">
                                                            <Avatar
                                                                src={this.state.users.find(user => user.name === message.username).profile.image_72}
                                                                width={30} height={30} alt="pp"/>

                                                            <h5 className="Message-sender"> {this.state.users.find(user => user.name === message.username).real_name}
                                                                <div className="Message-text">
                                                                    {Parser(converter.makeHtml(message.message))}
                                                                    {message.files !== undefined ?
                                                                        // console.log(typeof (JSON.parse(message.files)))
                                                                        JSON.parse(message.files).map(file => {
                                                                            switch (file.filetype) {
                                                                                case 'jpg' || 'jpeg' || 'png' || 'svg' || 'gif':
                                                                                    return(
                                                                                        <img src={file.url_private} width={400} height={300} alt=""/>
                                                                                    );
                                                                                case 'mp4' || 'avi' || 'wmv':
                                                                                    return(
                                                                                        <Player src={file.url_private} fluid={false} height={300} width={400} alt=""/>
                                                                                    );
                                                                                default:
                                                                                    return(
                                                                                        <div>
                                                                                            <ButtonBase
                                                                                                focusRipple
                                                                                                key={file.id}
                                                                                                style={{width: 400, padding: 20, borderStyle: 'solid', borderWidth: 1, borderColor: "#d1cece", borderRadius: 7}}
                                                                                                onClick={() => window.location = file.url_private_download}>
                                                                                                <CloudDownload style={{position: 'absolute',right: 355, color: "#7dc1de"}}/>
                                                                                                <Typography style={{fontWeight: "700"}}>
                                                                                                    {file.name}
                                                                                                    <Typography>
                                                                                                        {Number(file.size)/(1024 * 1024) >= 1? Math.round(Number(file.size)/(1024 * 1024))+" MB " : Math.round(Number(file.size)/(1024))+" kb" }
                                                                                                    </Typography>
                                                                                                </Typography>
                                                                                            </ButtonBase>
                                                                                        </div>
                                                                                    );
                                                                            }
                                                                            // if (file.filetype === 'jpg' || 'jpeg' || 'png' || 'svg' || 'gif') {
                                                                            //     return(
                                                                            //         <img src={file.url_private} width={400} height={300} alt=""/>
                                                                            //     )
                                                                            // }
                                                                        })
                                                                        : console.log("No files")}
                                                                </div>
                                                            </h5>
                                                            <p className="Message-time">{moment.unix(message.timestamp).format('h:mm a')}</p>
                                                        </div>
                                                    ))
                                                }</div>
                                            </div>

                                        ))
                                        : (
                                            <div>
                                                <img src={slackbot} width={500} height={500} alt="" style={{paddingLeft: "25%", paddingRight: "25%", paddingTop: "10%"}}/>
                                            </div>
                                        )
                                }
                            </div>
                        </Grid>
                    </Grid>
                </div>
            </div>
        );
    }
}


export default App;
