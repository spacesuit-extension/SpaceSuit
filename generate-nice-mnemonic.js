const bip39 = require('bip39')

const words = [
  'alien',
  'atom',
  'beyond',
  'boost',
  'brain',
  'buzz',
  'captain',
  'chaos',
  'charge',
  'crater',
  'daring',
  'energy',
  'engine',
  'evolve',
  'exhaust',
  'flash',
  'future',
  'galaxy',
  'genius',
  'glow',
  'gravity',
  'helmet',
  'hero',
  'jacket',
  'journey',
  'light',
  'lunar',
  'matrix',
  'moon',
  'nuclear',
  'orbit',
  'pilot',
  'planet',
  'quantum',
  'robot',
  'rocket',
  'science',
  'solar',
  'space',
  'suit',
  'sun',
  'theory',
  'tomorrow',
  'universe',
  'vacuum',
  'vessel',
  'void',
  'voyage',
]

while (true) {
  let wordSet = new Set()
  let sentence = []
  for (let i = 0; i < 12; i++) {
    let word = words[Math.floor(Math.random() * words.length)]
    sentence.push(word)
    wordSet.add(word)
  }
  let seed = sentence.join(' ')
  if (bip39.validateMnemonic(seed) && wordSet.size === 12) console.log(seed)
}
