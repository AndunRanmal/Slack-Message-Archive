import React, {Component} from 'react';
import LinearProgress from "@material-ui/core/LinearProgress/LinearProgress";
import moment from "moment";
import Avatar from "@material-ui/core/Avatar/Avatar";
import Player from "video-react/lib/components/Player";
import ButtonBase from "@material-ui/core/ButtonBase/ButtonBase";
import CloudDownload from '@material-ui/icons/CloudDownload';
import Typography from "@material-ui/core/Typography/Typography";
import Button from '@material-ui/core/Button';
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import purple from '@material-ui/core/colors/purple';
import green from '@material-ui/core/colors/green';

import slackbot from "./Slackbot.png";

const showdown = require("showdown");
const Parser = require('html-react-parser');
const converter = new showdown.Converter();

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#ff4400',
        },
        secondary: {
            light: '#24ff13',
            main: '#17780f',
        }
    },
});

class MessageContainer extends Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    joinChannel = (channel) => {
        console.log(channel);
    };


    render() {
        return (
            <div>
                {
                    this.props.loading ? (
                        <LinearProgress style={{backgroundColor: "#942e95"}}/>) : console.log("Loading complete")
                }

                {
                    this.props.groups !== null ?
                        this.props.channels.find(channel => channel.name === this.props.value.slice(1).toLocaleLowerCase()).is_member === false ?
                            <div className='Join-channel'>
                                <p className="Join-channel-headText"> You are viewing <span
                                    style={{color: "#000", fontWeight: "700"}}>{this.props.value}</span></p>
                                <p className="Join-channel-text"> created by {this.props.users.find(user => user.id ===
                                    (this.props.channels.find(channel => channel.name === this.props.value.slice(1).toLocaleLowerCase()).creator)).name} on
                                    {" "+moment.unix(Number(this.props.channels.find(channel => channel.name === this.props.value.slice(1).toLocaleLowerCase()).created)).format("MMMM Do YYYY")}
                                </p>
                                <MuiThemeProvider theme={theme}>
                                    <Button style={{color: "#fff"}} variant="contained" color="secondary" onClick={() => this.joinChannel(this.props.value)}>
                                        Join Channel
                                    </Button>

                                </MuiThemeProvider>

                            </div> :

                            Object.keys(this.props.groups).map(group => (
                                <div>
                                    <h1 className="Message-date">{moment.unix(Number(group) * (60 * 60 * 24)).format("dddd MMMM Do YYYY")}</h1>
                                    <div>{

                                        this.props.groups[group].map(message => (
                                            this.props.members.find(member => member.displayName === message.username).checked ?
                                                <div className="Message-row">
                                                    <Avatar
                                                        src={this.props.users.find(user => user.name === message.username).profile.image_72}
                                                        width={30} height={30} alt="pp"/>

                                                    <h5 className="Message-sender"> {this.props.users.find(user => user.name === message.username).real_name}
                                                        <div className="Message-text">
                                                            {/*{Parser(converter.makeHtml(message.message).contains("<@U"))}*/}
                                                            {message.message.includes("<@U") ?
                                                                Parser(converter.makeHtml(message.message.replace(message.message.slice(message.message.indexOf("<@U"), message.message.indexOf("<@U") + 12), "@" + this.props.users.find(user => user.id === (message.message.split(">")[0]).slice(-9)).real_name)))
                                                                // (this.state.users.find(user => user.id === (message.message.split(">")[0]).slice(2))).real_name + " " + Parser(converter.makeHtml(message.message).split(">")[2])
                                                                :
                                                                Parser(converter.makeHtml(message.message))}
                                                            {message.files !== undefined ?
                                                                // console.log(typeof (JSON.parse(message.files)))
                                                                JSON.parse(message.files).map(file => {
                                                                    switch (file.filetype) {
                                                                        case 'jpg' || 'jpeg' || 'png' || 'svg' || 'gif':
                                                                            return (
                                                                                <img src={file.url_private} width={400}
                                                                                     height={300} alt=""/>
                                                                            );
                                                                        case 'mp4' || 'avi' || 'wmv':
                                                                            return (
                                                                                <Player src={file.url_private}
                                                                                        fluid={false}
                                                                                        height={300} width={400}
                                                                                        alt=""/>
                                                                            );
                                                                        default:
                                                                            return (
                                                                                <div>
                                                                                    <ButtonBase
                                                                                        focusRipple
                                                                                        key={file.id}
                                                                                        style={{
                                                                                            width: 400,
                                                                                            padding: 20,
                                                                                            borderStyle: 'solid',
                                                                                            borderWidth: 1,
                                                                                            borderColor: "#d1cece",
                                                                                            borderRadius: 7
                                                                                        }}
                                                                                        onClick={() => window.location = file.url_private_download}>
                                                                                        <CloudDownload style={{
                                                                                            position: 'absolute',
                                                                                            right: 355,
                                                                                            color: "#7dc1de"
                                                                                        }}/>
                                                                                        <Typography
                                                                                            style={{fontWeight: "700"}}>
                                                                                            {file.name}
                                                                                            <Typography>
                                                                                                {Number(file.size) / (1024 * 1024) >= 1 ? Math.round(Number(file.size) / (1024 * 1024)) + " MB " : Math.round(Number(file.size) / (1024)) + " kb"}
                                                                                            </Typography>
                                                                                        </Typography>
                                                                                    </ButtonBase>
                                                                                </div>
                                                                            );
                                                                    }
                                                                })
                                                                : console.log("No files")}
                                                        </div>
                                                    </h5>
                                                    <p className="Message-time">{moment.unix(message.timestamp).format('h:mm a')}</p>
                                                </div> : console.log("Filtered")
                                        ))
                                    }
                                    </div>
                                </div>

                            ))
                        : (
                            <div>
                                <img src={slackbot} width={500} height={500} alt=""
                                     style={{paddingLeft: "25%", paddingRight: "25%", paddingTop: "10%"}}/>
                            </div>
                        )
                }
            </div>
        );
    }
}

export default MessageContainer