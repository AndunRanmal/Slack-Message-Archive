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
import Checkbox from '@material-ui/core/Checkbox';
import "./../node_modules/video-react/dist/video-react.css";

import MessageContainer from './MessageContainer';
import './App.css';
import APIs from './const/API';


const slack_token = process.env.REACT_APP_SLACKTOKEN;
console.log(process.env);

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
            members: []
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
        let channelMembers = this.state.channels.find(channel => channel.name === this.state.value.slice(1).toLocaleLowerCase()).members;
        let membersInfo = channelMembers.map((member) => ({
            name: this.state.users.find(user => user.id === member).real_name,
            avatar: this.state.users.find(user => user.id === member).profile.image_48,
            displayName:  this.state.users.find(user => user.id === member).name,
            checked: true
        }));

        this.setState({
            members: membersInfo
        }, () => console.log("members",this.state.members));

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
            groups: sort,
            loading: false
        })
    };


    handleSubmit = (searchTerm) => {
        this.setState({
            messages: [],
            value: searchTerm,
            loading: true

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

    handleDrawerOpen = () => {
        this.setState({ open: true });
    };

    handleDrawerClose = () => {
        this.setState({ open: false });
    };

    handleChange = (member) => {
        this.state.members[member].checked = !this.state.members[member].checked;
        this.setState({
            members: [...this.state.members]
        }, () => console.log(this.state.members));
        console.log(member)
    };

    render() {
        console.log(this.state.users);
        const {value} = this.state;
        const active_channels = this.state.channels.filter(channel => channel.is_archived === false);
        const filteredData = this.state.messages.filter(message => message.timestamp >= this.state.fromDate && message.timestamp <= this.state.toDate);
        let data;
        if (this.state.toDate === "" && this.state.fromDate === "") {
            data = this.state.messages
        } else {
            data = filteredData
        }
        const { open } = this.state;

        return (
            <div className="App">
                {/*<header className="App-header">*/}
                    {/*<IntegrationAutosuggest searchQuery={this.handleSubmit}/>*/}
                    {/*<img src={logo} width={40} height={40} className="Logo-styles" alt=""/>*/}
                {/*</header>*/}
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
                                        onClick={this.handleDrawerOpen}
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
                                <MessageContainer groups={this.state.groups} loading={this.state.loading} users={this.state.users} members={this.state.members}/>

                                <Drawer
                                    variant="persistent"
                                    anchor="right"
                                    open={open}

                                >
                                    <div>
                                        <IconButton onClick={this.handleDrawerClose}>
                                            <ChevronRightIcon /> <p style={{fontSize: 16, fontWeight: "700"}}>{"About "+ this.state.value}</p>
                                        </IconButton>
                                    </div>
                                    <Divider />
                                    <ExpansionPanel style={{width: 300}}>
                                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                            <InfoIcon style={{color: "#4789e5", paddingRight: 10, paddingBottom: 10}}/>
                                            <Typography style={{fontWeight: "600"}}> Channel Details </Typography>
                                        </ExpansionPanelSummary>
                                        <ExpansionPanelDetails>
                                            <Typography>
                                                {this.state.channels !== [] && this.state.value !== ''?
                                                    this.state.channels.find(channel => channel.name === this.state.value.slice(1).toLocaleLowerCase()).purpose.value : console.log("loading")}
                                            </Typography>
                                        </ExpansionPanelDetails>
                                    </ExpansionPanel>
                                    <ExpansionPanel defaultExpanded style={{width: 300}}>
                                        <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                            <PermIdentity style={{color: "#0ca92d", paddingRight: 10, paddingBottom: 10}}/>
                                            <Typography style={{fontWeight: "600"}}> Members </Typography>
                                        </ExpansionPanelSummary>
                                    <ExpansionPanelDetails>
                                        <List>
                                            {this.state.members !== [] && this.state.value !== ''?
                                                Object.keys(this.state.members).map((member) => (
                                                    <div>
                                                        <ListItem button key={member}>
                                                            <ListItemIcon>
                                                                <Avatar src={this.state.members[member].avatar} style={{width:30, height:30}}/>
                                                            </ListItemIcon>
                                                            {/*{this.state.users.find(user => user.id === member).name}*/}
                                                            <ListItemText secondary={this.state.members[member].name} />
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
                                    <Divider />
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
