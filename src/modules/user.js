import { string } from 'pg-format'
import {pool} from '../config/db.js'
import { getDay } from './scheduleLogic.js'



export const saveUser = async (msg) => {
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
    let tName = await pool.query(`SELECT * FROM groups WHERE name LIKE '%${group}%'`);
    tName = tName.rows[0]
    await pool.query(`UPDATE users SET "group" = '${tName.name}', "profile" = 'student', id_tnorgroup = ${tName.id}  WHERE id = ${id}`);
}

export const setFullName = async (id, name) => {
    let tName = await pool.query(`SELECT * FROM teacher_names WHERE name LIKE '%${name}%'`);
    tName = tName.rows[0]
    await pool.query(`UPDATE users SET "full_teacher_name" = '${tName.name}', "profile" = 'teacher', id_tnorgroup = ${tName.id} WHERE id = ${id}`);
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
            txt += `▀*\n`
            txt += `_Если нет удобной клавиатуры "сегодня/завтра" ⮕ /keyt_`
            keyB.inline_keyboard.push([])
            keyB.inline_keyboard[0].push({ "text": "СМЕНИТЬ ГРУППУ", 'callback_data': 'changeFNorGroup-' + user.delmsg + '-group'})    
        } else if (user.profile === "teacher") {
            txt += `*▄\n`
            txt += `▸ 👤 Вы: учитель\n`
            txt += `▸ 👥 ФИО: ${user.full_teacher_name}\n`
            txt += `▸ 📆 Рассылка: ${user.time_notification_flag ? 'включена' : 'выключена'}\n`
            txt += `▸ ⌚️ Время рассылки: ${user.time_notification}\n`
            txt += `▀*\n`
            txt += `_Если нет удобной клавиатуры "сегодня/завтра" ⮕ /keyt_`
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
    let user = await pool.query(`SELECT report_text, id, report_data FROM users WHERE id = ${id}`);

    user = user.rows[0]

    let report_data = user.report_data.split('-')

    let gORfn  

    if (report_data[0] === 'student') {
        gORfn = await pool.query(`SELECT name FROM public.groups WHERE id = ${report_data[1]}`);
    } else {
        gORfn = await pool.query(`SELECT name FROM teacher_names WHERE id = ${report_data[1]}`);
    }
    gORfn = gORfn.rows[0].name

    let dayText = await getDay('00', report_data[2], {'profile': report_data[0], 'group': gORfn, 'full_teacher_name': gORfn})

    let textFIN = `ID Пользователя: ${id}\n`
    + `Жалоба на:\n${dayText}\n\n`
    + `Описание проблемы:\n${user.report_text}`

    await pool.query(`INSERT INTO tickets(user_id,type) VALUES(${user.id}, 'MIP')`);

    let idT = await pool.query(`'SELECT id FROM tickets ORDER BY id DESC LIMIT 1'`);

    idT = idT.rows[0].ticket_id

    await pool.query(`INSERT INTO messages(ticket_id, sender_id, message) VALUES (${idT}, ${user.id}, ${textFIN})`);
    
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



