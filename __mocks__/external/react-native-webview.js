const React = require('react');
const {View} = require('react-native');

const WebView = props => React.createElement(View, props);
WebView.displayName = 'WebView';

module.exports = WebView;
module.exports.default = WebView;
