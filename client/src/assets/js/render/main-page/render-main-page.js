// "use strict";
let _playerPositionID = null;
let _tempPlayerPositionID = null;
let _$containers = {};
let _gameState = null;
_token = {token: loadFromStorage("token")};
_gameID = loadFromStorage("gameId");

function renderMainPage() {
    _$containers = {
        giveUpPopup: document.querySelector("#give-up-popup"),
        cardsParent: document.querySelector("#cards-parent"),
        rollDiceOpenDialog: document.querySelector("#roll-dice-open-dialog"),
        rollDiceDialog: document.querySelector("#roll-dice-dialog"),
        backToCurrentPositionButton: document.querySelector("#back-to-current-position button")
    };
    document.querySelector("#map").addEventListener("click", showMap);
    document.querySelector("#left-arrow").addEventListener("click", moveLeft);
    document.querySelector("#right-arrow").addEventListener("click", moveRight);
    document.querySelector("main").addEventListener("wheel", wheelEvent);
    document.addEventListener('keydown', keyPressEvent);
    document.querySelector("#back-to-current-position button").addEventListener("click", function (e) {
        _$containers.backToCurrentPositionButton.classList.toggle("hidden");
        seeOtherPlayerPosition(e);
    });
    document.querySelector("#give-up").addEventListener("click", giveUp);
    document.querySelector("#give-up-deny").addEventListener("click", giveUpDeny);
    document.querySelector("#give-up-confirm").addEventListener("click", loseGame);
    document.querySelector(`#buy`).addEventListener('click', buyProperty);
    document.querySelector("#trade").addEventListener("click", initTrade);
    document.querySelector("#trade-select-player").addEventListener("click", selectPlayer);
    document.querySelector("#cancel-select-player").addEventListener("click", cancelSelectPlayer);
    document.querySelector("#cancel-trading").addEventListener("click", cancelTrading);
    document.querySelector("#player1 ul").addEventListener("click", addToOffers);
    document.querySelector("#player2 ul").addEventListener("click", addToWants);
    document.querySelector("#send-trade").addEventListener("click", sendTrade);
    document.querySelector("#roll-dice").addEventListener("click", rollDice);
    _$containers["rollDiceOpenDialog"].addEventListener('click', () => {
        openDialog(_$containers.rollDiceDialog);
    });
    document.querySelector("#cancel-roll-dice").addEventListener('click', function () {
        closeDialog(_$containers.rollDiceDialog);
    });

    document.querySelector("#roll-dice-oke").addEventListener('click', () => {
        closeDialog(_$containers.rollDiceDialog);
        resetRollDiceText();
        togglePopUpButtons();
    });
    renderFirstTime();
}

function renderFirstTime() {
    fetchFromServer(`/games/${_gameID}`, "GET")
        .then(currentGameInfo => {
            _gameState = currentGameInfo;
            renderPlayerInfo(currentGameInfo);
            checkIfPlayerBankrupt(currentGameInfo);
            checkIfPlayerCanRoll(currentGameInfo);
            getTiles(currentGameInfo);
            setTimeout(pollingGameState, 2000);
        });
}

function seeOtherPlayerPosition(e) {
    goToPlayerPosition(e.currentTarget.id);
}

function goToPlayerPosition(playerName) {
    removeTemplateContents("#cards-parent article");
    let currentTileName = null;
    // Find the current tile of the player
    _gameState.players.forEach(function (player) {
        if (player.name === playerName) {
            currentTileName = player.currentTile;
        }
        showBackToPositionButton();
    });
    // Find that tile in localStorage
    findTileId(currentTileName);
}

function renderCards(currentGameInfo) {
    removeTemplateContents("#cards-parent article");
    let currentTileName = null;
    const playerName = loadFromStorage("name");
    // Find the current tile of the player
    currentGameInfo.players.forEach(function (player) {
        if (player.name === playerName) {
            currentTileName = player.currentTile;
        }
    });
    // Find that tile in localStorage
    findTileId(currentTileName);
}

function showBackToPositionButton() {
    if (_$containers.backToCurrentPositionButton.classList.contains("hidden")) {
        _$containers.backToCurrentPositionButton.classList.toggle("hidden");
    }
}


function getCardById(id) {
    const toShow = createToShow(id, id - 2, id + 3);
    for (const cardId of toShow) {
        if (cardId === id) {
            showCards(loadFromStorage("tiles")[cardId], true);
        } else {
            showCards(loadFromStorage("tiles")[cardId], false);
        }
    }
    // We also update these here because we don't want to wait for polling while scrolling (user experience)
    checkIfBought(_gameState);
    checkIfPlayerOnTile(_gameState);
}

function createToShow(id, firstId, lastId) {
    const toShow = [];
    if (id === 0) {
        toShow.push(38, 39, 0, 1, 2);
    } else if (id === 1) {
        toShow.push(39, 0, 1, 2, 3);
    } else if (id === 38) {
        toShow.push(36, 37, 38, 39, 0);
    } else if (id === 39) {
        toShow.push(37, 38, 39, 0, 1);
    } else {
        for (let i = firstId; i < lastId; i++) {
            toShow.push(i);
        }
    }
    return toShow;
}

function showCards(cardInfo, middle) {
    switch (cardInfo.type) {
        case "street":
            renderNormalCard(cardInfo, middle);
            break;
        case "utility":
            renderUtilityCard(cardInfo, middle);
            break;
        case "railroad":
            renderRailroad(cardInfo, middle);
            break;
        default:
            renderSpecialCard(cardInfo, middle);
            return;
    }
}

function renderPlayerInfo(currentGameInfo) {
    currentGameInfo.players.forEach(function (player) {
        const $template = document.querySelector('.player-info-template').content.firstElementChild.cloneNode(true);
        $template.id = nameToId(player.name);
        $template.querySelector(".player-balance").innerText = `${player.name}: ${player.money}`;
        if (player.name === loadFromStorage("name")) {
            $template.querySelector("img").src = `assets/media/${loadFromStorage("iconId")}.png`;
        }
        document.querySelector('footer').insertAdjacentHTML("beforeend", $template.outerHTML);
        document.querySelectorAll(`.info-container`).forEach(element => element.addEventListener('click', seeOtherPlayerPosition));
    });
}

function renderBoughtFooter(property, playerName) {
    document.querySelector(`#${playerName} .${property}`).classList.remove("not-bought");
}

function renderMortgagedFooter(property, playerName) {
    document.querySelector(`#${playerName} .${property}`).classList.remove("not-bought");
    document.querySelector(`#${playerName} .${property}`).classList.add("mortgaged");
}

function renderMortgagedMain($propertyCard, playerName) {
    $propertyCard.querySelector(`.player-bought`).classList.add("hidden");
    $propertyCard.querySelector(`.player-mortgaged`).classList.remove("hidden");
    $propertyCard.style.border = "orange solid 0.1rem";
    $propertyCard.querySelector(`.player-mortgaged span`).innerText = playerName;

}

function renderBoughtMain($propertyCard, playerName) {
    $propertyCard.querySelector(`.price`).classList.add("hidden");
    $propertyCard.querySelector(`.player-mortgaged`).classList.add("hidden");
    $propertyCard.querySelector(`.player-bought`).classList.remove("hidden");
    $propertyCard.style.border = "red solid";
    $propertyCard.querySelector(`.player-bought span`).innerText = playerName;
}

function renderPlayerBankrupt(playerName) {
    const $container = document.querySelector(`#${playerName}`);
    $container.style.opacity = "0.5";
    $container.querySelector("p").style.color = "red";
    $container.querySelector("p").innerHTML = `${playerName}: BANKRUPT`;
}

function renderPlayerOnTile(tile, playerName) {
    document.querySelector(`#${tile} .player-pos`).classList.remove('hidden');
    const playersOnTile = document.querySelector(`#${tile} .player-pos span`).innerText.toLowerCase();
    if (!playersOnTile.includes(playerName)) {
        document.querySelector(`#${tile} .player-pos span`).insertAdjacentHTML("beforeend", `${playerName} `);
    }
}


function showMap() {
    window.location.href = "see-all-the-streets-with-owners.html";
}

function giveUp() {
    _$containers["giveUpPopup"].classList.remove("hidden");
    document.querySelector("section").classList.add("hidden");

}

function giveUpDeny() {
    document.querySelector("section").classList.remove("hidden");
    _$containers["giveUpPopup"].classList.add("hidden");
}

function closeDialog($dialog) {
    $dialog.close();
}

function openDialog($dialog) {
    $dialog.showModal();
}

function resetRollDiceText(){
    _$containers.rollDiceDialog.querySelector("p").innerText = "You can roll the dice";
    _$containers.rollDiceDialog.querySelector("#location").innerText = "";
}
