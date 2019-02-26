import React from 'react';
import PropTypes from 'prop-types';
import Autosuggest from 'react-autosuggest';
import match from 'autosuggest-highlight/match';
import parse from 'autosuggest-highlight/parse';
import TextField from '@material-ui/core/TextField';
import Paper from '@material-ui/core/Paper';
import MenuItem from '@material-ui/core/MenuItem';
import {withStyles} from '@material-ui/core/styles';
import axios from "axios";
import APIs from "./const/API";
import Button from "@material-ui/core/Button/Button";

const env = require('dotenv').config();

const slack_token = process.env.REACT_APP_SLACKTOKEN;

const styles = theme => ({
    root: {
        left: 50,
        flexDirection: 'column'
    },
    container: {
        position: 'relative',
        marginLeft: 10
    },
    suggestionsContainerOpen: {
        position: 'absolute',
        zIndex: 1,
        marginTop: theme.spacing.unit,
        left: 10,
        right: '1%',
    },
    suggestion: {
        display: 'block',
    },
    suggestionsList: {
        margin: 0,
        padding: 0,
        listStyleType: 'none',
    },
    divider: {
        height: theme.spacing.unit * 2,
    },
    input: {
        // marginLeft: 100,
        textAlign: 'left',
        color: "#fff",
        // backgroundColor: "#474e5a",
        outlineColor: "#fff",
    },
    inputLabel: {
        color: 'red'
    },
});

class IntegrationAutosuggest extends React.Component {
    state = {
        value: '',
        popper: '',
        suggestions: [],
    };

    renderInputComponent = (inputProps) => {
        const {
            classes, inputRef = () => {
            }, ref, ...other
        } = inputProps;

        return (
            <TextField
                id="outlined-search"
                label="Search text, @name, #channel"
                type="search"
                margin="normal"
                variant="outlined"
                InputProps={{
                    inputRef: node => {
                        ref(node);
                        inputRef(node);
                    },
                    classes: {
                        input: classes.input
                    },
                }}
                {...other}
                InputLabelProps={{
                    style: {
                        color: '#9f9f9f',
                        fontSize: 12
                    } }}
            />
        );
    };

    getSuggestions = value => {
        const inputValue = value.trim().toLowerCase().slice(1);
        const inputLength = inputValue.length;
        switch (value) {
            case "@" + value.slice(1):
                return inputLength === 0 ? [] : this.state.users.filter(user =>
                    user.name.toLowerCase().slice(0, inputLength) === inputValue
                );
            case "#" + value.slice(1):
                return inputLength === 0 ? [] : this.state.channels.filter(channel =>
                    channel.name.toLowerCase().slice(0, inputLength) === inputValue
                );

            default:
                return [];

        }
    };


    handleSuggestionsFetchRequested = ({value}) => {
        this.setState({
            suggestions: this.getSuggestions(value),
        });
    };

    handleSuggestionsClearRequested = () => {
        this.setState({
            suggestions: [],
        });
    };

    getSuggestionValue = (suggestion) => {
        switch (this.state.value) {
            case "@" + this.state.value.slice(1):
                return "@" + suggestion.name;
            case "#" + this.state.value.slice(1):
                return "#" + suggestion.name;
            default:
                console.log("Text search");
                break
        }
    };

    renderSuggestion = (suggestion, {query, isHighlighted}) => {
        const matches = match(suggestion.name, query);
        const parts = parse(suggestion.name, matches);

        return (
            <MenuItem selected={isHighlighted} component="div">
                <div>
                    {parts.map((part, index) =>
                            part.highlight ? (
                                <span key={String(index)} style={{fontWeight: 500}}>
              {part.text}
            </span>
                            ) : (
                                <strong key={String(index)} style={{fontWeight: 300}}>
                                    {part.text}
                                </strong>
                            ),
                    )}
                </div>
            </MenuItem>
        );
    };

    handleChange = value => (event, {newValue}) => {
        this.setState({
            [value]: newValue
        });
    };

    componentDidMount() {
        axios.get(APIs.slack.slack_users + "?token=" + slack_token)
            .then(response => {
                this.setState({
                    users: response.data.members
                })
            });

        axios.get(APIs.slack.slack_channels + "?token=" + slack_token)
            .then(response => {
                this.setState({
                    channels: response.data.channels
                }, () => console.log(this.state.channels))
            })
    }

    render() {
        const {classes} = this.props;

        const autosuggestProps = {
            renderInputComponent: this.renderInputComponent,
            suggestions: this.state.suggestions,
            onSuggestionsFetchRequested: this.handleSuggestionsFetchRequested,
            onSuggestionsClearRequested: this.handleSuggestionsClearRequested,
            getSuggestionValue: this.getSuggestionValue,
            renderSuggestion: this.renderSuggestion,
        };

        return (
            <div style={{display: 'flex', flexDirection: 'row'}}>
                <Autosuggest
                    {...autosuggestProps}
                    inputProps={{
                        classes,
                        value: this.state.value,
                        onChange: this.handleChange('value'),
                    }}
                    theme={{
                        container: classes.container,
                        suggestionsContainerOpen: classes.suggestionsContainerOpen,
                        suggestionsList: classes.suggestionsList,
                        suggestion: classes.suggestion,
                    }}
                    renderSuggestionsContainer={options => (
                        <Paper {...options.containerProps} square>
                            {options.children}
                        </Paper>
                    )}
                />
                <Button variant="contained" size="small" color="primary" style={{marginLeft: 10, marginBottom: 10, marginTop: 40}}
                        onClick={() => this.props.searchQuery(this.state.value)}>
                    Search
                </Button>
            </div>
        );
    }
}

IntegrationAutosuggest.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(IntegrationAutosuggest);
