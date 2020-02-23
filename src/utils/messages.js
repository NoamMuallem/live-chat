const generateMsg = (text, name) => {
    return {
        text,
        createdAt: new Date().getTime(),
        name
    }
}

const generateLocationMsg = (location, name) => {
    return {
        location,
        createdAt: new Date().getTime(),
        name
    }
}

module.exports = {
    generateMsg,
    generateLocationMsg
}