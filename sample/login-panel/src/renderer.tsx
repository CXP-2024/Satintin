import React from 'react'
import { render } from 'react-dom'
import { HashRouter, Route, Switch } from 'react-router-dom'
import LoginPage, {loginPagePath} from "Pages/LoginPage";
import RegisterPage, {registerPagePath} from "Pages/RegisterPage";
import BookPage, {bookPagePath} from "Pages/BookPage";
import '../public/output.css'
import WebSocketDemo, {websocketPath} from "Pages/WebsocketDemo";

const Layout = () => {
    return (
        <HashRouter>
            <Switch>
                <Route path="/" exact component={LoginPage} />
                <Route path={registerPagePath} exact component={RegisterPage} />
                <Route path={loginPagePath} exact component={LoginPage} />
                <Route path={bookPagePath} exact component={BookPage} />
                <Route path={websocketPath} exact component={WebSocketDemo} />
            </Switch>
        </HashRouter>
    )
}
render(<Layout />, document.getElementById('root'))
