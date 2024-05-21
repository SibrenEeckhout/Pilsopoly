'use strict';

function loadGameDataForLobby(){
    _$interfaces.iconInterface.classList.add("hidden");
    fetchFromServer(`/games?prefix=${_config.prefix}`)
        .then(response => {
            const game = findGameByID(response, _gameID);
            if (game.started === true) {
                window.location.href = "index.html";
            }
            const numberOfPlayers = game.numberOfPlayers;
            const playerNames = game.players;
            renderLobby(_gameID, numberOfPlayers, playerNames);
        });
}
