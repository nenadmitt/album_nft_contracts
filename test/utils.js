const generateAlbumItems = (len) => {

    const items = [];
    for (let i = 0; i < len; i++) {
        items.push({id:i +1, name:`Name#${i +1}`})
    }
    return items;
}

const RANDOM_PROVIDER_CONTRACT = "BlockRandomProvider";
const ALBUM_CONTRACT = "SampleAlbum";
const REGISTAR_CONTRACT = "AlbumRegistar";

const RARE_CARD_DRAWN_EVENT = "RareCardDrawn";
const PACK_OPENED_EVENT = "PackOpened"

module.exports = {
    generateAlbumItems,
    RANDOM_PROVIDER_CONTRACT,
    ALBUM_CONTRACT,
    REGISTAR_CONTRACT,
    RARE_CARD_DRAWN_EVENT,
    PACK_OPENED_EVENT
}