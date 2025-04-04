import React from "react";
import IpoList from "./components/IpoList";
import CreateIpo from "./components/CreateIpo";

function App() {
    return (
        <div>
            <h1>IPO Management</h1>
            <CreateIpo />
            <IpoList />
        </div>
    );
}

export default App;
