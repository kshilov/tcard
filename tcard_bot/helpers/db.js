'use strict';

/**
 * Searches for chat by it's id, creates new chat if doesn't exist yet
 * @param {Telegram:ChatId} id Id of the chat to search
 * @returns Chat with the specified id
 */
async function findChat(id) {
    // let chat = await Chat.findOne({ id })
    let chat = 0

    if (!chat) {
//      chat = new Chat({ id })
//      chat = await chat.save()
    }
    return chat
}
  
// Exports
module.exports = {
    findChat,
}
    