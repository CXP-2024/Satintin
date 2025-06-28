import React from 'react'
import { render } from 'react-dom'
import { HashRouter, Route, Switch } from 'react-router-dom'
import LoginPage, {loginPagePath} from "Pages/LoginPage";
import RegisterPage, {registerPagePath} from "Pages/RegisterPage";
import BookPage, {bookPagePath} from "Pages/BookPage";

const Layout = () => {
    return (
        <HashRouter>
            <Switch>
                <Route path="/" exact component={LoginPage} />
                <Route path={registerPagePath} exact component={RegisterPage} />
                <Route path={loginPagePath} exact component={LoginPage} />
                <Route path={bookPagePath} exact component={BookPage} />
            </Switch>
        </HashRouter>
    )
}
render(<Layout />, document.getElementById('root'))
