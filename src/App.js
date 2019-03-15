import React, {Component} from 'react';
import axios from 'axios';
import moment from 'moment';
//Material Ui
import Grid from "@material-ui/core/Grid";
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import PermIdentity from '@material-ui/icons/PermIdentity';
import Drawer from '@material-ui/core/Drawer';
import Avatar from "@material-ui/core/Avatar/Avatar";
import Divider from '@material-ui/core/Divider';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import LockIcon from '@material-ui/icons/Lock';
import Checkbox from '@material-ui/core/Checkbox';
import "./../node_modules/video-react/dist/video-react.css";


import MessageContainer from './MessageContainer';
import './App.css';
import APIs from './const/API';


const slack_token = process.env.REACT_APP_SLACKTOKEN;
const OAuth = process.env.REACT_APP_SLACKOAUTH;
console.log(slack_token);

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
            sortedMessages: [],
            loading: false,
            members: [],
            userId: '',
            conversations: [],
            privateChannels: []
        };
    }

    componentDidMount() {
        axios.get(APIs.slack.slack_users + "?token=" + slack_token)
            .then(response => {
                console.log(response);
                this.setState({
                    users: response.data.members
                })
            })
            .catch(err => console.log(err));

        axios.post(APIs.slack.slack_auth_test + "?token=" + OAuth)
            .then(res => this.setState({
                userId: res.data.user_id
            }));

        axios.get(APIs.slack.slack_channels + "?token=" + slack_token)
            .then(response => {
                this.setState({
                    channels: response.data.channels
                })
            })
            .catch(err => console.log(err));

        axios.get(APIs.slack.slack_user_conversation + "?token=" + OAuth + "&types=private_channel")
            .then(response => {
                let privateChannels = response.data.channels.filter(channel => channel.is_archived === false);
                privateChannels.sort((a, b) => (a.last_read > b.last_read) ? 0 : ((b.last_read > a.last_read) ? 0 : -1));
                privateChannels.reverse();
                this.setState({
                    privateChannels: privateChannels
                })
            })
            .catch(err => console.log(err));

        axios.get(APIs.slack.slack_user_conversation + "?token=" + OAuth + "&types=mpim")
            .then(response => {
                let conversations = response.data.channels.filter(channel => channel.is_archived === false);
                conversations.sort((a, b) => (a.last_read > b.last_read) ? 0 : ((b.last_read > a.last_read) ? 0 : -1));
                conversations.reverse();
                this.setState({
                    conversations: conversations
                })
            })
            .catch(err => console.log(err))

    }

    mapMessagesToGroups = (response) => {
        let sort = {};
        byday = {};
        response.data.map(message => {
            let username = this.state.users.find(user => user.id === message.sender_Id).name;


            let messageInfo = {
                message_Id: message.message_id,
                message: message.message,
                username: username,
                timestamp: message.timestamp,
                // channel: channel,
                files: message.files
            };
            this.setState({
                // groups: null,
                messages: [...this.state.messages, messageInfo]
            });
            return this.state
        });
        //sorting messages inside a group
        this.state.messages.map(this.groupday);
        this.setState({
            groups: byday
        }, () => Object.keys(this.state.groups).map(group => {
                this.state.groups[group].sort((a, b) => a.timestamp < b.timestamp ? -1 : 1);

                sort[group] = this.state.groups[group];
                return sort
            }
        ));
        this.setState({
            groups: sort,
            loading: false
        })
    };

    getMessagesByChannel = (response) => {
        let channelMembers = this.state.channels.find(channel => channel.name === this.state.value.slice(1).toLocaleLowerCase()).members;
        let membersInfo = channelMembers.map((member) => ({
            name: this.state.users.find(user => user.id === member).real_name,
            avatar: this.state.users.find(user => user.id === member).profile.image_48,
            displayName: this.state.users.find(user => user.id === member).name,
            checked: true,
            id: member
        }));

        this.setState({
            members: membersInfo
        }, () => console.log(this.state.members));

        this.mapMessagesToGroups(response)
    };

    getMessagesByGroup = (response, id) => {
        axios.get(APIs.slack.slack_group_info + "?token=" + OAuth + "&channel=" + id)
            .then(res => {
                let members = res.data.group.members;
                let membersInfo = members.map((member) => ({
                    name: this.state.users.find(user => user.id === member).real_name,
                    avatar: this.state.users.find(user => user.id === member).profile.image_48,
                    displayName: this.state.users.find(user => user.id === member).name,
                    checked: true,
                    id: member
                }));

                this.setState({
                    members: membersInfo
                });
                // let channel = this.state.conversations.find(channel => channel.id === id).name;
                this.mapMessagesToGroups(response)

            })
            .catch(err => console.log(err));
    };


    handleSubmit = (searchTerm) => {
        console.log("debug", this.state.value);
        this.setState({
            messages: [],
            value: searchTerm,
            loading: true,
            members: [],
            groups: []
        }, () => {
            console.log("initial state", this.state);
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
                            this.getMessagesByChannel(response);
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
                            this.getMessagesByChannel(response)
                        })
                        .catch(err => {
                            console.log(err);
                            this.setState({
                                messages: []
                            })
                        });
                    break;
                case ("mpdm-" + this.state.value.slice(5)):
                    let conversationName = this.state.value;
                    console.log(conversationName);
                    let conversation_Id = this.state.conversations.find(chat => chat.name === conversationName).id;
                    console.log(conversation_Id);
                    axios.get(APIs.aws.base_url + "/chats?text=_" + conversation_Id)
                        .then(response => {
                            if (response.data.length === 0) {
                                console.log("No record found");
                            }
                            console.log(response.data);
                            this.getMessagesByGroup(response, conversation_Id)
                        })
                        .catch(err => {
                            console.log(err);
                            this.setState({
                                messages: []
                            })
                        });
                    break;
                default:
                    let privateChannel = this.state.value;
                    console.log(conversationName);
                    let privateChannelId = this.state.privateChannels.find(chat => chat.name === privateChannel).id;
                    console.log(privateChannelId);
                    axios.get(APIs.aws.base_url + "/chats?text=_" + privateChannelId)
                        .then(response => {
                            if (response.data.length === 0) {
                                console.log("No record found");
                            }
                            console.log(response.data);
                            this.getMessagesByGroup(response, privateChannelId)
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
        d = Math.floor(d._d.getTime() / (1000 * 60 * 60 * 24));
        byday[d] = byday[d] || [];
        byday[d].push(value);
        return byday;
    };

    handleDrawerOpen = () => {
        this.setState({open: true});
    };

    handleDrawerClose = () => {
        this.setState({open: false});
    };

    handleChange = (member) => {
        this.state.members[member].checked = !this.state.members[member].checked;
        this.setState({
            members: [...this.state.members]
        }, () => console.log(this.state.members));
    };

    renderMessages = (value) => {
        switch (value) {
            case ("#" + this.state.value.slice(1)):
                return (
                    <MessageContainer groups={this.state.groups} loading={this.state.loading}
                                      users={this.state.users} members={this.state.members} value={this.state.value}
                                      channels={this.state.channels} slice={1}/>
                );
            case ("mpdm-" + this.state.value.slice(5)):
                return (
                    <MessageContainer groups={this.state.groups} loading={this.state.loading}
                                      users={this.state.users} members={this.state.members} value={this.state.value}
                                      channels={this.state.conversations} slice={0}/>
                );
            default:
                return (
                    <MessageContainer groups={this.state.groups} loading={this.state.loading}
                                      users={this.state.users} members={this.state.members} value={this.state.value}
                                      channels={this.state.privateChannels}/>
                )


        }
    };

    renderChannelPurpose = () => {
        switch (this.state.value) {
            case ("#" + this.state.value.slice(1)):
                return (
                    <Typography>
                        {this.state.channels.find(channel => channel.name === this.state.value.slice(1).toLocaleLowerCase()).purpose.value}
                    </Typography>
                );
            case ("mpdm-" + this.state.value.slice(5)):
                return (
                    <Typography>
                        {this.state.conversations.find(channel => channel.name === this.state.value).purpose.value}
                    </Typography>
                );
            default:
                return (
                    <Typography>
                        {this.state.privateChannels.find(channel => channel.name === this.state.value).purpose.value}
                    </Typography>
                )
        }
    };

    render() {
        const {value} = this.state;
        const active_channels = this.state.channels.filter(channel => channel.is_archived === false && channel.members.includes(this.state.userId));
        const filteredData = this.state.messages.filter(message => message.timestamp >= this.state.fromDate && message.timestamp <= this.state.toDate);
        let data;
        if (this.state.toDate === "" && this.state.fromDate === "") {
            data = this.state.messages
        } else {
            data = filteredData
        }
        const {open} = this.state;

        return (
            <div className="App">
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
                                                        color: '#d8d8d8',
                                                        fontSize: 15,
                                                        fontWeight: "500",
                                                        marginLeft: 10
                                                    }}>#{channel.name}</Typography>}/>
                                                </ListItem>
                                                {/*<Divider light/>*/}
                                            </div>
                                        ))
                                    }
                                    {
                                        this.state.privateChannels.slice(0, 6).map(chat => (
                                            <div>
                                                <ListItem key={value} button
                                                          onClick={() => this.handleSubmit(chat.name)}>
                                                    <LockIcon style={{
                                                        color: "#949494",
                                                        fontSize: 16,
                                                        marginRight: -12,
                                                        marginLeft: 5
                                                    }}/>
                                                    <ListItemText primary={
                                                        <Typography style={{
                                                            color: '#d8d8d8',
                                                            fontSize: 15,
                                                            fontWeight: "500",
                                                        }}> {chat.name} </Typography>}/>
                                                </ListItem>
                                                {/*<Divider light/>*/}
                                            </div>
                                        ))
                                    }
                                    <p style={{
                                        color: "#fff",
                                        fontWeight: "700",
                                        marginLeft: 10,
                                        fontSize: 16
                                    }}> Conversations </p>
                                    {
                                        this.state.conversations.slice(0, 6).map(chat => (
                                            <div>
                                                <ListItem key={value} button
                                                          onClick={() => this.handleSubmit(chat.name)}>
                                                    <ListItemText primary={
                                                        <Typography style={{
                                                            color: '#d8d8d8',
                                                            fontSize: 15,
                                                            fontWeight: "500",
                                                            marginLeft: 10
                                                        }}> {chat.name.slice(5, -2).split("--").join(", ")} </Typography>}/>
                                                </ListItem>
                                                {/*<Divider light/>*/}
                                            </div>
                                        ))
                                    }

                                </List>
                            </div>
                        </Grid>
                        <Grid item xs={9}>
                            <AppBar position="static" style={{backgroundColor: '#2d162d'}}>
                                <Toolbar>
                                    <IconButton
                                        style={{position: 'absolute', right: 10}}
                                        aria-haspopup="true"
                                        color="inherit"
                                        onClick={this.handleDrawerOpen}
                                    >
                                        <InfoIcon/>
                                    </IconButton>
                                    <Typography variant="h6" color="inherit" noWrap>
                                        {this.state.value.startsWith("mpdm")? this.state.value.slice(5, -2).split("--").join(", ") : this.state.value}
                                    </Typography>
                                    {/*<div className={classes.grow} />*/}

                                </Toolbar>
                            </AppBar>
                            {/*{table}*/}
                            <div className="Message-container">

                                {/*<MessageContainer groups={this.state.groups} loading={this.state.loading}*/}
                                {/*users={this.state.users} members={this.state.members} value={this.state.value} channels={this.state.channels}/>*/}

                                {this.renderMessages(this.state.value)}

                                <Drawer
                                    variant="persistent"
                                    anchor="right"
                                    open={open}

                                >
                                    <div>
                                        <IconButton onClick={this.handleDrawerClose}>
                                            <ChevronRightIcon/> <p
                                            style={{fontSize: 16, fontWeight: "700", width: 200}}>{"About this channel"}</p>
                                        </IconButton>
                                    </div>
                                    <Divider/>

                                    <ExpansionPanel style={{width: 300}}>
                                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                            <InfoIcon style={{color: "#4789e5", paddingRight: 10}}/>
                                            <Typography style={{fontWeight: "550"}}> Channel Details </Typography>
                                        </ExpansionPanelSummary>
                                        <ExpansionPanelDetails>

                                                {this.state.channels !== [] && this.state.value !== '' ?
                                                    this.renderChannelPurpose() : console.log("loading")}

                                        </ExpansionPanelDetails>
                                    </ExpansionPanel>

                                    <ExpansionPanel defaultExpanded style={{width: 300}}>
                                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                                            <PermIdentity style={{color: "#0ca92d", paddingRight: 10}}/>
                                            <Typography style={{fontWeight: "550"}}> Members </Typography>
                                        </ExpansionPanelSummary>
                                        <ExpansionPanelDetails style={{marginTop: -20}}>
                                            <List>
                                                {this.state.members !== [] && this.state.value !== '' ?
                                                    Object.keys(this.state.members).map((member) => (
                                                        <div>
                                                            <ListItem button key={member} style={{marginTop: -5}}>
                                                                <ListItemIcon>
                                                                    <Avatar src={this.state.members[member].avatar}
                                                                            style={{width: 30, height: 30}}/>
                                                                </ListItemIcon>
                                                                {/*{this.state.users.find(user => user.id === member).name}*/}
                                                                <ListItemText
                                                                    secondary={this.state.members[member].name}/>
                                                                <Checkbox
                                                                    checked={this.state.members[member].checked}
                                                                    onChange={() => this.handleChange(member)}
                                                                />
                                                            </ListItem>
                                                        </div>

                                                    )) : console.log("Loading")}
                                            </List>
                                        </ExpansionPanelDetails>
                                    </ExpansionPanel>
                                    <Divider/>
                                </Drawer>
                            </div>

                        </Grid>
                    </Grid>
                </div>
            </div>
        );
    }
}


export default App;
