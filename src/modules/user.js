import { string } from 'pg-format'
import {pool} from '../config/db.js'



export const saveUser = async (msg) => {
    console.log(msg);
    let id = msg.chat.id
    let first_name = msg.chat.first_name
    let last_name = msg.chat.last_name
    let username = msg.chat.username
    
    
    let ids = await pool.query(`SELECT id FROM users WHERE id = ${id}`);


    if (!ids.rowCount) {
        await pool.query(`INSERT INTO users (id, first_name, last_name, username) VALUES (${id}, '${String(first_name)}', '${String(last_name)}', '${String(username)}')`);
    }

}

export const setGroup = async (id, group) => {
    await pool.query(`UPDATE users SET "group" = '${group}', "profile" = 'student' WHERE id = ${id}`);
}

export const setFullName = async (id, name) => {
    let tName = await pool.query(`SELECT name FROM teacher_names WHERE name LIKE '%${name}%'`);
    tName = tName.rows[0].name
    await pool.query(`UPDATE users SET "full_teacher_name" = '${tName}', "profile" = 'teacher' WHERE id = ${id}`);
}

export const setData = async (id, column, data, type) => {
    if (type === 'string') {
        await pool.query(`UPDATE users SET "${column}" = '${data}' WHERE id = ${id}`);
    } else if (type === 'boolean') {
        await pool.query(`UPDATE users SET "${column}" = ${data} WHERE id = ${id}`);
    }
}
export const getData = async (id, column) => {
    let res = await pool.query(`SELECT ${column} FROM users WHERE id = ${id}`);
    return res.rows[0][column]
}

export const setProfile = async (id, profile) => {
    await pool.query(`UPDATE users SET "profile" = '${profile}' WHERE id = ${id}`);
}



export const setMSGidForDel = async (id, msgID) => {
    await pool.query(`UPDATE users SET "delmsg" = ${msgID} WHERE id = ${id}`);
}

export const showProfile = async (id, action) => {
    let user = await pool.query(`SELECT * FROM users WHERE id = ${id}`);
    user = user.rows[0]

    let txt = ''
    let keyB = {"inline_keyboard": []};

    if (action === 'toChange') {
        txt += `*`
        txt += `Выбирете профиль:`
        txt += `*`

        keyB.inline_keyboard.push([])
        keyB.inline_keyboard[0].push({ "text": "СТУДЕНТ", 'callback_data': 'setRole-' + user.delmsg + '-student'})
        keyB.inline_keyboard.push([])
        keyB.inline_keyboard[1].push({ "text": "УЧИТЕЛЬ", 'callback_data': 'setRole-' + user.delmsg + '-teacher'})
    } else if (action === 'toConfigure'){
        txt += `*`
        txt += `Настройки уведомлений:`
        txt += `*`

        keyB.inline_keyboard.push([])
        keyB.inline_keyboard[0].push({ "text": "ВКЛ/ВЫКЛ уедомления по времени", 'callback_data': 'setTime_Notification_Flag-' + user.delmsg + `-${!user.time_notification_flag}`})
        keyB.inline_keyboard.push([])
        keyB.inline_keyboard[1].push({ "text": "настроить уедомления по времени", 'callback_data': 'setTime_Notification-' + user.delmsg + `-none` + `-${user.time_notification}`})
        // keyB.inline_keyboard.push([])
        // keyB.inline_keyboard[2].push({ "text": "ВКЛ/ВЫКЛ уедомления о предстоящей паре", 'callback_data': 'setRole-' + user.delmsg + '-teacher'})

    } else {
        if (user.profile === "student") {
            txt += `*▄\n`
            txt += `▸ 👤 Вы: студент\n`
            txt += `▸ 👥 Группа: ${user.group}\n`
            txt += `▸ 📆 Рассылка: ${user.time_notification_flag ? 'включена' : 'выключена'}\n`
            txt += `▸ ⌚️ Время рассылки: ${user.time_notification}\n`
            txt += `▀*`
            keyB.inline_keyboard.push([])
            keyB.inline_keyboard[0].push({ "text": "СМЕНИТЬ ГРУППУ", 'callback_data': 'changeFNorGroup-' + user.delmsg + '-group'})    
        } else if (user.profile === "teacher") {
            txt += `*▄\n`
            txt += `▸ 👤 Вы: учитель\n`
            txt += `▸ 👥 ФИО: ${user.full_teacher_name}\n`
            txt += `▸ 📆 Рассылка: ${user.time_notification_flag ? 'включена' : 'выключена'}\n`
            txt += `▸ ⌚️ Время рассылки: ${user.time_notification}\n`
            txt += `▀*`
            keyB.inline_keyboard.push([])
            keyB.inline_keyboard[0].push({ "text": "СМЕНИТЬ ФИО", 'callback_data': 'changeFNorGroup-' + user.delmsg + '-fullName'})    
        }
        
        keyB.inline_keyboard.push([])
        keyB.inline_keyboard[0].push({ "text": "СМЕНИТЬ ПРОФИЛЬ", 'callback_data': 'showProfile-' + user.delmsg + '-toChange'})
        keyB.inline_keyboard.push([])
        keyB.inline_keyboard[1].push({ "text": "НАСТРОИТЬ", 'callback_data': 'showProfile-' + user.delmsg + '-toConfigure'})

    }

    keyB = {
        reply_markup: `{"inline_keyboard":${JSON.stringify(keyB.inline_keyboard)}}`
    }


    
    return [txt, user.delmsg, keyB]
}


export const reportFunction = async (id, text, msgID) => {
    await pool.query(`UPDATE users SET "report_text" = '${text}', report_flag = false WHERE id = ${id}`);

    let txt = 'Вы уверенны что хотите отправить?\nЭтот текст:\n\n' + text
    let keyB = {"inline_keyboard": []};


    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[0].push({ "text": "ДА(отправить)", 'callback_data': 'report' + '-toPost' + `-${msgID}`})
    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[1].push({ "text": "НЕТ(написать другой)", 'callback_data': 'report' + '-toСancel' + `-${msgID}`})

    keyB = {
        reply_markup: `{"inline_keyboard":${JSON.stringify(keyB.inline_keyboard)}}`
    }

    return [txt, keyB]
}

export const reportPost = async (id) => {
    let user = await pool.query(`SELECT report_text, id FROM users WHERE id = ${id}`);

    // console.log(user.rows[0]);
}

// report_text
// ▄
// ▸ 👤 Вы: студент
// ▸ 👥 Группа: КП1А21 КДВ
// ▸ 📆 Рассылка: выключена
// ▸ ⌚️ Время рассылки: 9:00
// ▀

// {
//     id: 884131132,
//     group: 'КП1А21 КДВ',
//     usageCounter: 0,
//     lastUse: null,
//     first_name: 'Иван',
//     last_name: 'KaToni',
//     username: 'I_KaToni_I',
//     profile: 'student'
// }

function getInfoUser(chat_id, info) {
    let file = fs.readFileSync("../SAVES/student.json", { encoding: 'utf8' })
    let JN = JSON.parse(file)


    return JN[chat_id][info]
}



function stressSave(ID) {
    let file = fs.readFileSync("../SAVES/student.json", { encoding: 'utf8' })
    let JN = JSON.parse(file)
    if ("usageCounter" in JN[ID]) {
        if (typeof JN[ID]["usageCounter"] == 'string') {
            JN[ID]["usageCounter"] = 1
        } else {
            JN[ID]["usageCounter"] = JN[ID]["usageCounter"] + 1
        }
        JN[ID]["lastUse"] = new Date()
        
    } else {
        JN[ID]["usageCounter"] = 1
        JN[ID]["lastUse"] = new Date()
    }
    fs.writeFileSync("../SAVES/student.json", JSON.stringify(JN))
}

function saveBotMSG(chat_id, BotTXT) {
    let file = fs.readFileSync("../SAVES/student.json", { encoding: 'utf8' })
    let JN = JSON.parse(file)

    if (!JN[chat_id]["BotMSG"]) {
        JN[chat_id]["BotMSG"] = []
    }

    JN[chat_id]["BotMSG"].push(BotTXT)
    
    if (JN[chat_id]["BotMSG"].length > 5){
        JN[chat_id]["BotMSG"] = JN[chat_id]["BotMSG"].slice(1)
    }
    


    fs.writeFileSync("../SAVES/student.json", JSON.stringify(JN))
}


