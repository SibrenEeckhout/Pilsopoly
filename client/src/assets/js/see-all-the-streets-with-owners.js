"use strict";

/*fetch the streets and the players. if player puts input into the form go to function search*/
function initMap() {
    pollingGameState();
    const streetNames = [];
    _token = {token: loadFromStorage("token")};
    fetchFromServer(`/games/${_gameID}`, 'GET')
        .then(players => {
            linkPlayersAndStreets(players.players);
        });
    runStreets(loadFromStorage("tiles"), streetNames, "");
    document.querySelector('form').addEventListener('input', searchStreet);
}

/*if there is input, catch it => put it to lower case and go to the runstreets function*/
function searchStreet(e) {
    const streetNames = [];
    if (e.target.value) {
        runStreets(loadFromStorage("tiles"), streetNames, e.target.value.toLowerCase());
    } else {
        runStreets(loadFromStorage("tiles"), streetNames, "");
    }
}


/*filter on go, community, chance, Jail,Tax, Parking and carts that do not have the given letters in it*/
function runStreets(tiles, streetNames, sort) {
    removeTemplateContents("#card-container article");
    tiles.forEach(street => {
        if (street.name.toLowerCase().includes(sort) && (street.type === "utility" || street.type === "railroad" || street.type === "street")) {
            streetNames.push(street);
        }
    });
    removeTemplateContents("#card-template article");
    streetNames.forEach(function (street) {
        renderStreets(street);
    });
}


/* fill in the template with the api results*/
function renderStreets(street) {
    const $template = document.querySelector('.card-template').content.firstElementChild.cloneNode(true);
    $template.id = nameToId(street.name);
    $template.querySelector('.name').classList.add(street.color);
    $template.querySelector('.name').insertAdjacentHTML("afterbegin",street.name);
    $template.querySelector('.mortgage').innerText = `Mortgage ${street.mortgage}`;
    $template.querySelector('.price').innerText = `Cost: M${street.cost}`;
    $template.querySelector('.rent').innerText = `Rent: ${street.rent}`;
    $template.querySelector('.position').innerText = `Position: ${street.position}`;

    document.querySelector('#card-container').insertAdjacentHTML("beforeend", $template.outerHTML);
}
