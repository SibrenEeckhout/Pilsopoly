"use strict";

function pollingGameState() {
    // This needs to be on a diff place for sure!!
    fetchFromServer(`/games/${_gameID}`, "GET")
        .then(currentGameInfo => {
            checkGameStates(currentGameInfo);
            _gameState = currentGameInfo;
            setTimeout(pollingGameState, 2000);
        });
}

function checkGameStates(newGameState) {
    // if your on the map screen, all the other checks are not needed.
    if (document.querySelector("body").id === "see-all-the-streets-with-owners") {
        console.log("Only checking fot the map");
        checkIfBought(newGameState);
    } else if (JSON.stringify(newGameState) !== JSON.stringify(_gameState)) {
        if (newGameState.currentPlayer !== _gameState.currentPlayer){
            checkIfPlayerCanRoll(newGameState);
            checkIfPlayerNeedsToPayRent(newGameState);
        }
        checkIfBought(newGameState);
        checkIfPlayerOnTile(newGameState);
        checkPlayerBalance(newGameState);
        checkIfPlayerBankrupt(newGameState);

    }
}

function checkIfBought(gameInfo) {
    document.querySelectorAll('.square').forEach(square => square.classList.add("not-bought"));
    gameInfo.players.forEach(player => {
        player.properties.forEach(property => {
            // in case no properties are bought yet, property is 'null'
            if (property !== null) {
                const $propertyCard = document.querySelector(`#${nameToId(property.property)}`);
                const $propertyCardFooter = document.querySelector(`#${player.name} .${nameToId(property.property)}`);
                // $propertyCard doesn't need to be checked because the footer is always rendered in
                // Is the card mortgaged? Else render it as bought.
                if (property.mortgage && $propertyCardFooter !== null) {
                    renderMortgagedFooter(nameToId(property.property), player.name.toLowerCase());
                } else if ((!property.mortgage && $propertyCardFooter !== null)) {
                    renderBoughtFooter(nameToId(property.property), player.name.toLowerCase());
                }
                // $propertyCard !== null checks if the bought card is currently rendered in
                // Is the card mortgaged? Else render it as bought.
                if ($propertyCard !== null && property.mortgage) {
                    renderMortgagedMain($propertyCard, player.name);
                } else if ($propertyCard !== null) {
                    renderBoughtMain($propertyCard, player.name);
                }
            }
        });
    });
}

function checkPlayerBalance(gameInfo) {
    gameInfo.players.forEach(function (player) {
        document.querySelector(`#${player.name} .player-balance`).innerText = `${player.name}: ${player.money}`;
    });
}

function checkIfPlayerOnTile(gameInfo) {
    document.querySelectorAll(".player-pos").forEach(card =>{
        card.querySelector("span").innerText = "";
        card.classList.add("hidden");
    });
    const playersInfo = gameInfo.players;
    playersInfo.forEach(player => {
        // Checks if player is on a card that is currently shown on screen. (And filters out bankrupted players)
        if (document.querySelector(`#${nameToId(player.currentTile)}`) !== null && !player.bankrupt && document.querySelector("body").id !== "see-all-the-streets-with-owners") {
            renderPlayerOnTile(nameToId(player.currentTile), player.name);
        }
    });
}

function checkIfPlayerBankrupt(gameInfo) {
    gameInfo.players.forEach(player => {
        if (player.bankrupt) {
            renderPlayerBankrupt(player.name.toLowerCase());
        }
    });
}

function checkIfPlayerNeedsToPayRent(gameInfo){
    console.log(getLastTile(gameInfo));

    if (gameInfo.turns.length !== 0 && _gameState.currentPlayer !== loadFromStorage('name')){
        const inventory = loadFromStorage('inventory');
        if(inventory.includes(getLastTile(gameInfo))){
            collectDebt(getLastTile(gameInfo) , gameInfo.currentPlayer, loadFromStorage("name"));
        }
    }
    else {
        saveToStorage("rent", ``);
    }
}
