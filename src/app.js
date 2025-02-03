import TelegramApi from 'node-telegram-bot-api';
import 'dotenv/config'
import {pool} from './config/db.js'
import { getData, reportFunction, reportPost, saveUser, setData, setFullName, setGroup, setMSGidForDel, setProfile, showProfile } from './modules/user.js';
import { autoUpdateDB } from './autoUpdateDB/autoUpdateDB.js';
import { autoGroups, autoTeacherName, fun_getDay, KEYBOARD_report_fun, KEYBOARD_TT, timeSetting } from './modules/key.js';
import { getDay } from './modules/scheduleLogic.js';

process.env.NTBA_FIX_350 = true;

pool.query('SELECT NOW()', (err, res) => {
    if(err) {
      console.error('Error connecting to the database', err.stack);
    } else {
      console.log('Connected to the database:', res.rows);
    }
});

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}


autoUpdateDB()

// токен тест бота
const token = process.env.botTOKEN

// токен релиз бота
// const token =


const bot = new TelegramApi(token, { polling: true })

const botOnMSG = () => {
    bot.on('message', async msg => {
        let text = msg.text.toLowerCase().replace(/ +/g, ' ').trim();
        let chat_id = msg.chat.id;
        let botText
        console.log(text)
        console.log(chat_id);

        let resUser = await pool.query(`SELECT * FROM users WHERE id = ${chat_id}`)
        resUser = resUser.rows[0]

        // console.log(await pool.query(`SELECT * FROM users ORDER BY id DESC LIMIT 1`));
        
        try {

            
            if (resUser) {
                let resTime = await pool.query(`SELECT * FROM users WHERE id = ${chat_id} and NOW() - antispam > '00:00:04'`)
                if (!resTime.rows.length) {
                    return bot.sendMessage(chat_id, "<i>Пожалуйста, будьте помедленнее.\n(1 сообщение раз в 4 сек.)</i>", {parse_mode: 'HTML'});
                }
                await pool.query(`UPDATE users SET "antispam" = NOW() WHERE id = ${chat_id}`);
            }
            
            
            if (resUser) {
                if (resUser.report_flag) {
                    let KEYTEXT_reportFunction = await reportFunction(chat_id, msg.text, msg.message_id+1)
                    
                    return bot.sendMessage(chat_id, KEYTEXT_reportFunction[0], KEYTEXT_reportFunction[1]);
                }
            }
            
            if (text === "/start" || text === "/about") {
                
                await saveUser(msg)
                
                botText = "⚡️Этот бот открывает вам доступ к быстрому получению расписанию.\n\n"
                +"🔥 Для быстрого старта нажмите сюда --> /profil\n"
                +"\n"
                +"\n"
                +"Перечень команд:\n"
                +"⚙️ /profil - Чтобы настроить профиль.\n"
                +"🎯 /getday - Чтобы узнать расписание на определенный день.\n"
                +"🔄 /setgroup - Чтобы изменить свою группу\n"
                +"🔄 /setname - Чтобы изменить ФИО преподавателя\n"
                
                return bot.sendMessage(chat_id, botText);
            } 

            
            
            if (text === "/setgroup") {
                let KEYTEXT_autoGroups = await autoGroups(msg.message_id+1)
    
                return bot.sendMessage(chat_id, KEYTEXT_autoGroups[0], KEYTEXT_autoGroups[1]);
            }


            if (text === "/setname") {
                let KEYTEXT_autoTeacherName = await autoTeacherName(msg.message_id+1)
    
                return bot.sendMessage(chat_id, KEYTEXT_autoTeacherName[0], KEYTEXT_autoTeacherName[1]);
            }

            if (text === "/profil") {
                let apRes
                
                if (resUser.profile === null) {
                    apRes = await showProfile(chat_id, 'toChange')
                } else {
                    apRes = await showProfile(chat_id)
                }

                try {
                    await bot.deleteMessage(chat_id, apRes[1])
                } catch (er) {}
                
                let res = await bot.sendMessage(chat_id, apRes[0], {parse_mode: 'MarkdownV2', ...apRes[2]});
                
                await setMSGidForDel(chat_id, res.message_id)

                return null
            }

    
            if (text === "сегодня" || text === "завтра") {
                botText = await getDay(chat_id, text)

                await pool.query(`UPDATE users SET "usageCounter" = "usageCounter" + 1, "lastUse" = NOW() WHERE id = ${chat_id}`);

                
                
                return bot.sendMessage(chat_id, botText, {parse_mode: 'HTML', ...KEYBOARD_report_fun(resUser.profile, resUser.id_tnorgroup, text)});
            }
    
            if (text === "/getday") {
                let KEYTEXT_getDays = await fun_getDay(msg.message_id+1)
    
    
                return bot.sendMessage(chat_id, KEYTEXT_getDays[0], {...KEYTEXT_getDays[1], parse_mode: 'HTML'});
            }

            if (text === "/keyt") {
                return bot.sendMessage(chat_id, "🧩Не удаляйте это сообщение.🧩", {...KEYBOARD_TT, parse_mode: 'HTML'});
            }

            // if (msg.text.split(' ')[0] === "/addTeacher") {
            //     let res = await pool.query(`INSERT INTO teacher_names (name) VALUES ('${msg.text.split(' ')[1]}')`);

            //     console.log(res._types);

            //     return
            // }
    
            return bot.sendMessage(chat_id, "Я вас не понимаю😐")
        } catch (error) {
            console.log(Object.keys(error));
        }
    
    })
}
botOnMSG()






const botOnBTN = () => {
    bot.on('callback_query', async msg => {
        let dataBtn = msg.data.split("-");
        let chat_id = msg.message.chat.id;

        let botText
    
        try {
            if (dataBtn[0] === 'report'){
                let resTime = await pool.query(`SELECT * FROM users WHERE id = ${chat_id} and NOW() - report_datetime > '03:00'`)
                
                await pool.query(`UPDATE users SET "report_datetime" = NOW() WHERE id = ${chat_id}`);
                
                if (dataBtn[1] === 'toСancel') {
                    await bot.deleteMessage(chat_id, dataBtn[2])
                    await setData(chat_id, 'report_flag', 'true', 'boolean')
                    return bot.sendMessage(chat_id, "Опишите вашу проблему.", {parse_mode: 'HTML'});
                } else if (dataBtn[1] === 'toPost'){
                    await bot.deleteMessage(chat_id, dataBtn[2])
                    await reportPost(chat_id)
                    return bot.sendMessage(chat_id, "Ваша проблема принята к обработке.", {parse_mode: 'HTML'});
                }
                
                if (!resTime.rows.length) {
                    return bot.sendMessage(chat_id, "Вы не можете отправлять обращение чаще, чем раз в 3 часа.", {parse_mode: 'HTML'});
                }

                
                await setData(chat_id, 'report_flag', 'true', 'boolean')
                await setData(chat_id, 'report_data', `${dataBtn[1]}-${dataBtn[2]}-${dataBtn[3]}`, 'string')
                return bot.sendMessage(chat_id, "Опишите вашу проблему.", {parse_mode: 'HTML'});
            }
            

            if (dataBtn[0] === 'groupPC'){
                let KEYTEXT_autoGroups = await autoGroups(dataBtn[1], dataBtn[2], dataBtn[3])
                
                return bot.editMessageText(KEYTEXT_autoGroups[0], {
                    ...KEYTEXT_autoGroups[1],
                    chat_id: chat_id,
                    message_id: dataBtn[1]
                });
            }

            if (dataBtn[0] === 'fullNamePC'){
                let KEYTEXT_autoTeacherName = await autoTeacherName(dataBtn[1], dataBtn[2], dataBtn[3])
                
                return bot.editMessageText(KEYTEXT_autoTeacherName[0], {
                    ...KEYTEXT_autoTeacherName[1],
                    chat_id: chat_id,
                    message_id: dataBtn[1]
                });
            }
    
    
            if (dataBtn[0] === 'getDay'){
                let KEYTEXT_getDays = await fun_getDay(dataBtn[1], dataBtn[2], dataBtn[3], dataBtn[4], dataBtn[5])
    
                if (dataBtn[2]==='getDay') {
                    botText = await getDay(chat_id, dataBtn[3])
                    await pool.query(`UPDATE users SET "usageCounter" = "usageCounter" + 1, "lastUse" = NOW() WHERE id = ${chat_id}`);
                    return bot.sendMessage(chat_id, botText, {parse_mode: 'HTML', ...KEYBOARD_report_fun()});
                }
                
                if (KEYTEXT_getDays) {
                    return bot.editMessageText(KEYTEXT_getDays[0], {
                        ...KEYTEXT_getDays[1],
                        chat_id: chat_id,
                        message_id: dataBtn[1],
                        parse_mode: 'HTML'
                    });
                }
    
            }
    
            if (dataBtn[0] === 'showProfile'){
                let KEYTEXT_showProfile = await showProfile(chat_id, dataBtn[2])
    
                if (KEYTEXT_showProfile) {
                    return bot.editMessageText(KEYTEXT_showProfile[0], {
                        ...KEYTEXT_showProfile[2],
                        chat_id: chat_id,
                        message_id: KEYTEXT_showProfile[1],
                        parse_mode: 'MarkdownV2'
                    });
                }
    
            }
            
            if (dataBtn[0] === 'setGroup'){

                await setGroup(chat_id, dataBtn[1], msg.message.message_id)
                
                let apRes = await showProfile(chat_id)
    
                try {
                    await bot.deleteMessage(chat_id, apRes[1])
                } catch (er) {}
                
                let res = await bot.sendMessage(chat_id, apRes[0], {parse_mode: 'MarkdownV2', ...apRes[2]});
                
                await setMSGidForDel(chat_id, res.message_id)
            }

            if (dataBtn[0] === 'setFullName'){
                await setFullName(chat_id, dataBtn[1], msg.message.message_id)
                
                let apRes = await showProfile(chat_id)
    
                try {
                    await bot.deleteMessage(chat_id, apRes[1])
                } catch (er) {}
                
                let res = await bot.sendMessage(chat_id, apRes[0], {parse_mode: 'MarkdownV2', ...apRes[2]});
                
                await setMSGidForDel(chat_id, res.message_id)
            }




    
            if (dataBtn[0] === 'setRole'){
                await setProfile(chat_id, dataBtn[2])
    
                let apRes = await showProfile(chat_id)
                try {
                    await bot.deleteMessage(chat_id, apRes[1])
                } catch (er) {}
                
                let res = await bot.sendMessage(chat_id, apRes[0], {parse_mode: 'MarkdownV2', ...apRes[2]});
                
                await setMSGidForDel(chat_id, res.message_id)
    
            }
    
            if (dataBtn[0] === "setTime_Notification_Flag") {
                await setData(chat_id, 'time_notification_flag', dataBtn[2], 'boolean')
    
                let apRes = await showProfile(chat_id)
                try {
                    await bot.deleteMessage(chat_id, apRes[1])
                } catch (er) {}
                
                let res = await bot.sendMessage(chat_id, apRes[0], {parse_mode: 'MarkdownV2', ...apRes[2]});
                
                await setMSGidForDel(chat_id, res.message_id)
            }
    
    
            if (dataBtn[0] === "setTime_Notification") {
                
                if (dataBtn[2]==='setTime_Notification_complite') {
                    await setData(chat_id, 'time_notification', dataBtn[3], 'string')

                    let apRes = await showProfile(chat_id)
                    try {
                        await bot.deleteMessage(chat_id, apRes[1])
                    } catch (er) {}
                    
                    let res = await bot.sendMessage(chat_id, apRes[0], {parse_mode: 'MarkdownV2', ...apRes[2]});
                    
                    await setMSGidForDel(chat_id, res.message_id)

                    return null
                }
                
                let KEYTEXT_timeSetting = await timeSetting(dataBtn[1], dataBtn[2], dataBtn[3])
                

                if (KEYTEXT_timeSetting) {
                    return bot.editMessageText(KEYTEXT_timeSetting[0], {
                        ...KEYTEXT_timeSetting[1],
                        chat_id: chat_id,
                        message_id: dataBtn[1],
                        parse_mode: 'HTML'
                    });
                }
    
            }

            if (dataBtn[0] === "changeFNorGroup") {
                let res = await bot.sendMessage(chat_id, '<i>Загрузка...</i>', {parse_mode: 'HTML'});

                if (dataBtn[2] === 'group') {
                    let KEYTEXT_autoGroups = await autoGroups(res.message_id)

                    return bot.editMessageText(KEYTEXT_autoGroups[0], {
                        ...KEYTEXT_autoGroups[1],
                        chat_id: chat_id,
                        message_id: res.message_id,
                        parse_mode: 'HTML'
                    });
                } else if (dataBtn[2] === 'fullName') {
                    let KEYTEXT_autoTeacherName = await autoTeacherName(res.message_id)

                    return bot.editMessageText(KEYTEXT_autoTeacherName[0], {
                        ...KEYTEXT_autoTeacherName[1],
                        chat_id: chat_id,
                        message_id: res.message_id,
                        parse_mode: 'HTML'
                    });
                }
            }


            
        } catch (error) {
            console.log(error)
        }
    
    })
}
botOnBTN()







setInterval(async () => {
    let date = new Date().addHours(3)
    date = `${String(date.getHours()).length === 1 ? '0':''}${date.getHours()}:${String(date.getMinutes()).length === 1 ? '0':''}${date.getMinutes()}`
    
    let arr = await pool.query(`SELECT id, time_notification FROM users WHERE time_notification_flag = true and time_notification = '${date}'`);


    arr.rows.forEach(async el => {
        try {
            let botText = await getDay(el.id, "сегодня")
            botText = `⏰ Уведомление на ${el.time_notification}\n\n` + botText
            return bot.sendMessage(el.id, botText, {parse_mode: 'HTML'});
            
        } catch (error) {
            console.log(error);
        }
    })

        
}, 60000);