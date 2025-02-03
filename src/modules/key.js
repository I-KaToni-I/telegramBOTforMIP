import {pool} from '../config/db.js'

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}


function bDate(text){
    text = String(text)
    return text.length === 1 ? `0${text}` : `${text}`
}


export async function autoGroups(msgID, action, pager) {

    let page = pager || 1
    let arrGroup

    if (action === "Back") {
        --page
    } else if (action === "Next") {
        ++page
    }
    
    if (+page === 0) {
        arrGroup = await pool.query(`SELECT ARRAY(SELECT name FROM groups ORDER BY name)`);
        arrGroup = arrGroup.rows[0].array
        page = Math.ceil(arrGroup.length / 30)
    }
    arrGroup = await pool.query(`SELECT ARRAY(SELECT name FROM groups ORDER BY name LIMIT 30 OFFSET ${(+page-1)*30})`);
    arrGroup = arrGroup.rows[0].array
    
    if (arrGroup.length === 0) {
        page = 1
        arrGroup = await pool.query(`SELECT ARRAY(SELECT name FROM groups ORDER BY name LIMIT 30 OFFSET ${(+page-1)*30})`);
        arrGroup = arrGroup.rows[0].array
    }
    

    let keyB = {
        "inline_keyboard": [

        ]
    };


    let coc = 3
    let caunt = -1

    arrGroup.forEach(el => {
        if (el != '') {
            if (coc === 3) {
                coc = 1
                caunt += 1
                keyB.inline_keyboard.push([])
            }

            keyB.inline_keyboard[caunt].push({ "text": el, 'callback_data': 'setGroup-' + el })

            coc += 1
        }
    })

    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[caunt+1].push({ "text": "назад", 'callback_data': 'groupPC-' + msgID + '-Back' + `-${page}`})
    keyB.inline_keyboard[caunt+1].push({ "text": "вперед", 'callback_data': 'groupPC-' + msgID + '-Next' + `-${page}`})
    


    keyB = {
        reply_markup: `{"inline_keyboard":${JSON.stringify(keyB.inline_keyboard)}}`
    }

    return [`Страница: ${page}`, keyB]
}




// autoTeacherName autoTeacherName autoTeacherName autoTeacherName autoTeacherName autoTeacherName autoTeacherName
// autoTeacherName autoTeacherName autoTeacherName autoTeacherName autoTeacherName autoTeacherName autoTeacherName
export async function autoTeacherName(msgID, action, pager) {

    let page = pager || 1
    let arrTnames

    if (action === "Back") {
        --page
    } else if (action === "Next") {
        ++page
    }
    
    if (+page === 0) {
        arrTnames = await pool.query(`SELECT ARRAY(SELECT name FROM teacher_names ORDER BY name)`);
        arrTnames = arrTnames.rows[0].array
        page = Math.ceil(arrTnames.length / 20)
    }
    arrTnames = await pool.query(`SELECT ARRAY(SELECT name FROM teacher_names ORDER BY name LIMIT 20 OFFSET ${(+page-1)*20})`);
    arrTnames = arrTnames.rows[0].array

    
    
    if (arrTnames.length === 0) {
        page = 1
        arrTnames = await pool.query(`SELECT ARRAY(SELECT name FROM teacher_names ORDER BY name LIMIT 20 OFFSET ${(+page-1)*20})`);
        arrTnames = arrTnames.rows[0].array
    }
    
    
    let keyB = {
        "inline_keyboard": [
            
        ]
    };
    
    
    let coc = 3
    let caunt = -1
    
    arrTnames.forEach(el => {
        if (el != '') {
            if (coc === 3) {
                coc = 1
                caunt += 1
                keyB.inline_keyboard.push([])
            }
            // console.log({ "text": el.substring(0, 15), 'callback_data': 'setFullName-' + el});
            keyB.inline_keyboard[caunt].push({ "text": `${el.substring(0, 20)}${el.length >19 ? '...' : ''}`, 'callback_data': 'setFullName-' + el.substring(0, 20)})
            
            coc += 1
        }
    })
    
    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[caunt+1].push({ "text": "назад", 'callback_data': 'fullNamePC-' + msgID + '-Back' + `-${page}`})
    keyB.inline_keyboard[caunt+1].push({ "text": "вперед", 'callback_data': 'fullNamePC-' + msgID + '-Next' + `-${page}`})
    
    



    keyB = {
        reply_markup: `{"inline_keyboard":${JSON.stringify(keyB.inline_keyboard)}}`
    }

    return [`Страница: ${page}`, keyB]
}




export const fun_getDay = async (msgID, action, date_, oldDate, oldAction) => {
    // 
    if (date_ === oldDate && date_ !== undefined) {
        if (oldAction === action) {
            return false
        }
    }

    let date 
    let txt

    if (date_) {
        date = date_ // 2025.01.01
    } else {
        date = new Date().addHours(3)
        date = `${bDate(date.getDate())}.${bDate(date.getMonth()+1)}.${date.getFullYear()}` // 2025.01.01
    }
    let dateT = date
    date = date.split('.')

    
    
    let keyB = {
        "inline_keyboard": [

        ]
    };



    let caunt = -1
    
    if (action === 'year') {
        txt = 'год'
    
        let d = new Date().addHours(3).getFullYear()
        
        ++caunt
        
        keyB.inline_keyboard.push([])

        keyB.inline_keyboard[0].push({ "text": (d-1), 'callback_data': 'getDay-' + msgID + '-year' + `-${date[0]+'.'+date[1]+'.'+(d-1)}` + `-${dateT}` + `-${action}`})
        keyB.inline_keyboard[0].push({ "text": d, 'callback_data': 'getDay-' + msgID + '-year' + `-${date[0]+'.'+date[1]+'.'+d}`     + `-${dateT}` + `-${action}`})
        keyB.inline_keyboard[0].push({ "text": (d+1), 'callback_data': 'getDay-' + msgID + '-year' + `-${date[0]+'.'+date[1]+'.'+(d+1)}` + `-${dateT}` + `-${action}`})

    } else if (action === 'month') {
        txt = 'месяц'
    
        let coc = 6
        for (let el = 1; el < 13; el++) {
            
            if (coc === 6) {
                coc = 1
                ++caunt
                keyB.inline_keyboard.push([])
            }

            keyB.inline_keyboard[caunt].push({ "text": el, 'callback_data': 'getDay-' + msgID + '-month' + `-${date[0]+'.'+bDate(el)+'.'+date[2]}` + `-${dateT}` + `-${action}`})

            ++coc
        }
    } else {
        txt = 'день'

        let coc = 6
        for (let el = 1; el < 32; el++) {
            
            if (coc === 6) {
                coc = 1
                ++caunt
                keyB.inline_keyboard.push([])
            }

            keyB.inline_keyboard[caunt].push({ "text": el, 'callback_data': 'getDay-' + msgID + '-day' + `-${bDate(el)+'.'+date[1]+'.'+date[2]}` + `-${dateT}` + `-${action}`})

            ++coc
        }
    }

    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[caunt+1].push({ "text": "ДЕНЬ", 'callback_data': 'getDay-' + msgID + '-day' + `-${dateT}` + `-${dateT}` + `-${action}`})
    keyB.inline_keyboard[caunt+1].push({ "text": "МЕСЯЦ", 'callback_data': 'getDay-' + msgID + '-month' + `-${dateT}` + `-${dateT}` + `-${action}`})
    keyB.inline_keyboard[caunt+1].push({ "text": "ГОД", 'callback_data': 'getDay-' + msgID + '-year' + `-${dateT}` + `-${dateT}` + `-${action}`})

    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[caunt+2].push({ "text": "ЗАПРОС", 'callback_data': 'getDay-' + msgID + '-getDay'+ `-${dateT}`})


    keyB = {
        reply_markup: `{"inline_keyboard":${JSON.stringify(keyB.inline_keyboard)}}`
    }

    return [`┃настройте дату для запроса┃\n\n📆 <b>Дата: ${date.join('.')}</b>\n\n<i>Выбирете ${txt}:</i>`, keyB]
}






export const timeSetting = async (msgID, action, time) => {
    let arrTime = time.split(':').map(el => Number(el))
    

    if (action === '+10min') {
        arrTime[1] += 10
    } else if (action === '+1min') {
        arrTime[1] += 1
    } else if (action === '_10min') {
        arrTime[1] -= 10
    } else if (action === '_1min') {
        arrTime[1] -= 1
    }
    
    if (action === '+5hour') {
        arrTime[0] += 5
    } else if (action === '+1hour') {
        arrTime[0] += 1
    } else if (action === '_5hour') {
        arrTime[0] -= 5
    } else if (action === '_1hour') {
        arrTime[0] -= 1
    }


    if (arrTime[1] >= 60) {
        arrTime[1] = arrTime[1] - 60
        arrTime[0] = arrTime[0] + 1
    } else if (arrTime[1] < 0) {
        arrTime[1] = 60 + arrTime[1]
        arrTime[0] = arrTime[0] - 1
    }


    if (arrTime[0] > 23) {
        arrTime[0] = arrTime[0] - 24
    } else if (arrTime[0] < 0) {
        arrTime[0] = 24 + arrTime[0]
    }
    
    
    
    let keyB = {
        "inline_keyboard": [

        ]
    };

    time = [bDate(arrTime[0]), bDate(arrTime[1])].join(':')

    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[0].push({ "text": '+1ч.', 'callback_data': 'setTime_Notification-' + msgID + '-+1hour' + `-${time}`})
    keyB.inline_keyboard[0].push({ "text": '+5ч.', 'callback_data': 'setTime_Notification-' + msgID + '-+5hour' + `-${time}`})
    keyB.inline_keyboard[0].push({ "text": '+1мин.', 'callback_data': 'setTime_Notification-' + msgID + '-+1min' + `-${time}`})
    keyB.inline_keyboard[0].push({ "text": '+10мин.', 'callback_data': 'setTime_Notification-' + msgID + '-+10min' + `-${time}`})
    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[1].push({ "text": '-1ч.', 'callback_data': 'setTime_Notification-' + msgID + '-_1hour' + `-${time}`})
    keyB.inline_keyboard[1].push({ "text": '-5ч.', 'callback_data': 'setTime_Notification-' + msgID + '-_5hour' + `-${time}`})
    keyB.inline_keyboard[1].push({ "text": '-1мин.', 'callback_data': 'setTime_Notification-' + msgID + '-_1min' + `-${time}`})
    keyB.inline_keyboard[1].push({ "text": '-10мин.', 'callback_data': 'setTime_Notification-' + msgID + '-_10min' + `-${time}`})

    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[2].push({ "text": 'ПРИМЕНИТЬ', 'callback_data': 'setTime_Notification-' + msgID + '-setTime_Notification_complite' + `-${time}`})

    keyB = {
        reply_markup: `{"inline_keyboard":${JSON.stringify(keyB.inline_keyboard)}}`
    }

    return [`┃настройте вримя уведомления┃\n\n🕰 <b>Время уведомления: ${time}</b>`, keyB]
}





export const KEYBOARD_TT = {
    reply_markup: JSON.stringify({
    "keyboard": [
        [{ "text": "Сегодня" },],
        [{ "text": "Завтра" },],
    ],
    "resize_keyboard": true,
    "one_time_keyboard": true,
})
};




export const KEYBOARD_report_fun = (prof, profID, text) => {
    let keyB = {
        "inline_keyboard": [

        ]
    };

    let date = new Date().addHours(3)
    if (text === 'сегодня') {
        date = `${date.getFullYear()}.${date.getMonth()+1}.${date.getDate()}` // 2025-01-02
    } else if (text === 'завтра') {
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1)
        date = `${date.getFullYear()}.${date.getMonth()+1}.${date.getDate()}` // 2025-01-01
    } else {
        date = text
    }


    keyB.inline_keyboard.push([])
    keyB.inline_keyboard[0].push({ "text": 'ПРОБЛЕМА?', 'callback_data': `report-${prof}-${profID}-${date}`})

    return {reply_markup: `{"inline_keyboard":${JSON.stringify(keyB.inline_keyboard)}}`}
}





