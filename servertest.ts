let a

// a = await fetch('localhost:3000/pcs/get-config/0001', {
//   method: 'POST', body: JSON.stringify({
//     token: '12345'
//   })
// })
// console.log(await a.text())


a = await fetch('localhost:3000/pcs/get-actions/0001', {
  method: 'POST', body: JSON.stringify({
    token: '12345'
  })
})
console.log(await a.text())

// a = await fetch('localhost:3000/pcs/mark-completed/0001', {
//   method: 'POST', body: JSON.stringify({
//     token: '12345',
//     task_id: '0.6497423666442182',
//     info: 'none'
//   })
// })
// console.log(await a.text())
//
// a = await fetch('localhost:3000/pcs/log/0001', {
//   method: 'POST', body: JSON.stringify({
//     token: '12345',
//     type: "normal",
//     message: "test"
//   })
// })
// console.log(await a.text())
//

a = await fetch('localhost:3000/init-get-config',
  // {
  //   method: 'POST', body: JSON.stringify({
  //     token: '12345'
  //   })
  // }
)
console.log(await a.text())

a = await fetch('localhost:3000/pcs/get-update', {
  method: 'POST', body: JSON.stringify({
    token: '12345'
  })
})
Bun.write("./test", await a.blob())
