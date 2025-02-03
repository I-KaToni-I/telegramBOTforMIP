import { pool } from "../config/db.js";

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h*60*60*1000));
    return this;
}


function beautifulTime(text) {
    let txt = text.split(':')

    if (txt[1].length === 1){
        return `${txt[0]}:0${txt[1]}`
    }
    return text
}

function beautifulDate(text) {
    let arr = text.split('-')
    let txt = ''

    txt += arr[0]
    txt += arr[1].length === 1 ? `-0${arr[1]}` : `-${arr[1]}`
    txt += arr[2].length === 1 ? `-0${arr[2]}` : `-${arr[2]}`

    return txt
}


export const getDay = async (id, txt, userR) => {

    let date = new Date().addHours(3)
    if (txt === 'сегодня') {
        date = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}` // 2025-01-02
    } else if (txt === 'завтра') {
        date = new Date(date.getFullYear(), date.getMonth(), date.getDate()+1)
        date = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}` // 2025-01-01
    } else {
        txt = txt.split('.') // 14.04.4444
        date = `${txt[2]}-${txt[1]}-${txt[0]}`
    }

    let user
    if (userR) {
        user = userR
    } else {        
        user = await pool.query(`SELECT "group", profile, full_teacher_name FROM users WHERE id = ${id}`);
        user = user.rows[0]
    }
    

    let arrNeedEvent

    let needTabl = await pool.query('SELECT name FROM table_status WHERE status = true')

    needTabl = needTabl.rows[0].name

    if (user.profile === 'student') {
        arrNeedEvent = await pool.query(`SELECT * FROM ${needTabl} WHERE group_name = '${user.group}' and start_date <= '${date}' and '${date}' <= finish_date`)
        arrNeedEvent = arrNeedEvent.rows
    } else if (user.profile === 'teacher'){
        arrNeedEvent = await pool.query(`SELECT * FROM ${needTabl} WHERE  location LIKE '%${user.full_teacher_name}%' and start_date <= '${date}' and '${date}' <= finish_date`)
        arrNeedEvent = arrNeedEvent.rows
    }

   let finalTxt = ``

   arrNeedEvent.forEach(el => {

       let d = el.date_time.split('-')

       let t
       if (el.location) {
           t = el.location.split('-')
           if (finalTxt.indexOf(`${beautifulTime(d[0])}-${beautifulTime(d[1])}`) !== -1) {
                if (t[0].trim().split(' ').length === 1) {
                    finalTxt += '――――➕――――\n'
                    finalTxt += `\n`
                    finalTxt += `🏷 ${el.title}\n`
                    finalTxt += `🎯 ${t[0].trim()}\n`
                    finalTxt += `🧑‍🏫 ${t[1].trim()}\n`
                    finalTxt += `Группы/место: ${el.location.slice(el.location.indexOf(t[0])+t[0].length+1)}\n\n`
                } else if (t[0].trim().split(' ').length > 1) {
                    finalTxt += '――――➕――――\n'
                    finalTxt += `\n`
                    finalTxt += `🏷 ${el.title}\n`
                    finalTxt += `🎯 ОЧНО\n`
                    finalTxt += `🧑‍🏫 ${t[0].trim()}\n`
                    finalTxt += `Группы/место: ${el.location.slice(el.location.indexOf(t[0])+t[0].length+1)}\n\n`
                } 
            } else if (t[0].trim().split(' ').length === 1) {
               finalTxt += '――――――――――――――\n'
               finalTxt += `<b>🕰 ${beautifulTime(d[0])}-${beautifulTime(d[1])}</b>\n`
               finalTxt += `🏷 ${el.title}\n`
               finalTxt += `🎯 ${t[0].trim()}\n`
               finalTxt += `🧑‍🏫 ${t[1].trim()}\n`
               finalTxt += `Группы/место: ${el.location.slice(el.location.indexOf(t[0])+t[0].length+1)}\n\n`
           } else if (t[0].trim().split(' ').length > 1) {
               finalTxt += '――――――――――――――\n'
               finalTxt += `<b>🕰 ${beautifulTime(d[0])}-${beautifulTime(d[1])}</b>\n`
               finalTxt += `🏷 ${el.title}\n`
               finalTxt += `🎯 ОЧНО\n`
               finalTxt += `🧑‍🏫 ${t[0].trim()}\n`
               finalTxt += `Группы/место: ${el.location.slice(el.location.indexOf(t[0])+t[0].length+1)}\n\n`
           } 
       } else {
           finalTxt += '――――――――――――――\n'
           finalTxt += `<b>🕰 ${beautifulTime(d[0])}-${beautifulTime(d[1])}</b>\n`
           finalTxt += `🏷 ${el.title}\n`
       }
   });
   
   if (finalTxt) {
       finalTxt = '<b>'+beautifulDate(date)+'</b>\n'+finalTxt
       return finalTxt
   } else {
       finalTxt = '<b>'+beautifulDate(date)+'</b>\n――――――――――――――\n'+"Выходной"
       return finalTxt
   }
}












// 🕰 11:00-18:00
// 🏷 Психология современной семьи (лекция)
// 🎯 ОЧНО
// 🧑‍🏫 Ефимова Ольга Сергеевна 
// ПМ3А24/10 ПП, ПМ3А24/10 СК, ПМ3А24/10 КП, Кутузовский проспект, 34, стр. 14-5-509 (50)