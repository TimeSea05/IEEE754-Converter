const floatInputForm = document.getElementById('float-input-form')
const floatInput = document.getElementById('float')
floatInput.addEventListener('input', handleInputChange)

const IEEE754Float32 = document.getElementById('ieee754-float-32')
const IEEE754Float64Part1 = document.getElementById('ieee754-float-64-part1')
const IEEE754Float64Part2 = document.getElementById('ieee754-float-64-part2')

// NaN Prompt Element
const NaNPrompt = document.createElement('div')
NaNPrompt.innerHTML = 'Not a valid number. The following results are representations of NaN.'
NaNPrompt.classList.add('nan')
let isNaN = false

class ElemState {
  constructor(state) {
    this.state = state
  }
}
// Overflow Elememts
const overflowPrompt32 = document.createElement('div')
overflowPrompt32.innerHTML = 'Overflow detected. The result is a representation of Infinity.'
overflowPrompt32.classList.add('overflow')
let isOverflow32 = new ElemState(false)

const overflowPrompt64 = overflowPrompt32.cloneNode(true)
let isOverflow64 = new ElemState(false)

// Underflow Element
const hasDealtWithUnderflow = new ElemState(false)

const underflowPrompt32 = document.createElement('div')
underflowPrompt32.innerHTML = 'Underflow detected. The result is a representation of Zero'
underflowPrompt32.classList.add('underflow')
let isUnderflow32 = new ElemState(false)

const underflowPrompt64 = underflowPrompt32.cloneNode(true)
let isUnderflow64 = new ElemState(false)

const FLOAT32_EXP_LENGTH = 8
const FLOAT32_FRAC_LENGTH = 23
const FLOAT64_EXP_LENGTH = 11
const FLOAT64_FRAC_LENGTH = 52

function handleInputChange(event) {
  const floatNumStr = event.target.value
  const floatNum = Number(floatNumStr)

  if (Number.isNaN(floatNum) && !isNaN) {
    floatInputForm.after(NaNPrompt)
    isNaN = true
  } else if (!Number.isNaN(floatNum)) {
    NaNPrompt.remove()
    isNaN = false
  }

  function isNotValidZeroStr(str) {
    for (let char of str) {
      if (!(char === '0' || char === '.')) return true
    }
    return false
  }
  if (isNotValidZeroStr(floatNumStr) && floatNum === 0) {
    if (!isUnderflow32.state) IEEE754Float32.after(underflowPrompt32)
    if (!isUnderflow64.state) IEEE754Float64Part2.after(underflowPrompt64)
    isUnderflow64.state = true
    isUnderflow64.state = true

    hasDealtWithUnderflow.state = true
  } else hasDealtWithUnderflow.state = false

  /**
   * @param {number} floatNum float number that you want to detect overflow or underflow with
   * @param {string} type type of the float number: 'float32' or 'float64'
   * @param {HTMLUListElement} ul unordered list that you want to insert the prompt after
   * @param {ElemState} stateObj object that decides the state of the prompt node
   * @param {HTMLDivElement} prompt invalid state prompt
   * @param {string} flowState 'Overflow' or 'Underflow'
   */
  function setFlowState(floatNum, type, ul, stateObj, prompt, flowState) {
    if (detectOverflow(floatNum, type) === flowState && !stateObj.state) {
      ul.after(prompt)
      stateObj.state = true
    } else if (detectOverflow(floatNum, type) !== flowState && stateObj.state) {
      prompt.remove()
      stateObj.state = false
    }
  }
  setFlowState(floatNum, 'float32', IEEE754Float32, isOverflow32, overflowPrompt32, 'Overflow');
  setFlowState(floatNum, 'float64', IEEE754Float64Part2, isOverflow64, overflowPrompt64, 'Overflow');
  if (!hasDealtWithUnderflow.state) {
    setFlowState(floatNum, 'float32', IEEE754Float32, isUnderflow32, underflowPrompt32, 'Underflow');
    setFlowState(floatNum, 'float64', IEEE754Float64Part2, isUnderflow64, underflowPrompt64, 'Underflow');
  }

  const float32Str = calculateIEEEForm(floatNum, 'float32').reduce((str, elem) => str + elem, '')
  const float64Str = calculateIEEEForm(floatNum, 'float64').reduce((str, elem) => str + elem, '')

  // remove old bits
  while (IEEE754Float32.childNodes.length > 0) IEEE754Float32.childNodes[0].remove()
  while (IEEE754Float64Part1.childNodes.length > 0) IEEE754Float64Part1.childNodes[0].remove()
  while (IEEE754Float64Part2.childNodes.length > 0) IEEE754Float64Part2.childNodes[0].remove()

  // Add new bits
  for (let i = 0; i < float32Str.length; i++) {
    const bit = document.createElement('li')
    bit.innerHTML = float32Str[i]

    if (i === 0) bit.classList.add('sign-bit')
    else if (i > 0 && i < 1 + FLOAT32_EXP_LENGTH) bit.classList.add('exp-bit')
    else bit.classList.add('frac-bit')

    IEEE754Float32.append(bit)
  }

  for (let i = 0; i < float64Str.length; i++) {
    const bit = document.createElement('li')
    bit.innerHTML = float64Str[i]

    if (i === 0) bit.classList.add('sign-bit')
    else if (i > 0 && i < 1 + FLOAT64_EXP_LENGTH) bit.classList.add('exp-bit')
    else bit.classList.add('frac-bit')

    if (i < 32) IEEE754Float64Part1.append(bit)
    else IEEE754Float64Part2.append(bit)
  }
}

// MIN_FLOAT_32 & MAX_FLOAT_32
// From Golang: math.SmallestNonzeroFloat32 and math.MaxFloat32
const MIN_FLOAT_32 = 1.401298464324817e-45
const MAX_FLOAT_32 = 3.4028234663852886e+38
const MIN_FLOAT_64 = Number.MIN_VALUE
const MAX_FLOAT_64 = Number.MAX_VALUE

function detectOverflow(num, type) {
  if (Number.isNaN(num)) return null

  let max, min;
  if (type === 'float32') {
    max = MAX_FLOAT_32
    min = MIN_FLOAT_32
  } else if (type === 'float64') {
    max = MAX_FLOAT_64
    min = MIN_FLOAT_64
  }

  if (num > max) return 'Overflow'
  else if (num < min && num !== 0) return 'Underflow'

  return null
}

function handleIEEE754Exp(exp, type) {
  let offset, length
  if (type === 'float32') {
    offset = Math.pow(2, FLOAT32_EXP_LENGTH - 1) - 1
    length = FLOAT32_EXP_LENGTH
  } else if (type === 'float64') {
    offset = Math.pow(2, FLOAT64_EXP_LENGTH - 1) - 1
    length = FLOAT64_EXP_LENGTH
  }

  let expBinStr = (exp + offset).toString(2)
  if (exp + offset === -1 && type === 'float32') expBinStr = '11111111'
  else if (exp + offset === -1 && type === 'float64') expBinStr = '11111111111'

  while (expBinStr.length < length) expBinStr = '0' + expBinStr
  
  return expBinStr
}

function generateNaNOrInfinity(numType, type, sign = null) {
  const getZeroOrOne = () => {
    return String(Math.random() < 0.5 ? 0 : 1) 
  }

  let expLength, fracLength
  if (type === 'float32') expLength = FLOAT32_EXP_LENGTH, fracLength = FLOAT32_FRAC_LENGTH
  else if (type === 'float64') expLength = FLOAT64_EXP_LENGTH, fracLength = FLOAT64_FRAC_LENGTH

  let expBinStr = '', fracBinStrInf = '', fracBinStrNaN = ''
  for (let i = 0; i < expLength; i++) expBinStr += '1'
  for (let i = 0; i < fracLength; i++) {
    fracBinStrNaN += getZeroOrOne()
    fracBinStrInf += '0' 
  }

  if (numType === 'NaN') return [getZeroOrOne(), expBinStr, fracBinStrNaN]
  else if (numType === 'Infinity') return [String(sign), expBinStr, fracBinStrInf]
}

function getSign(num) {
  if (num === 0) {
    if (Object.is(num, -0)) return 1
    return 0
  }
  return (num > 0) ? 0 : 1
}

function calculateIEEEForm(num, type) {
  let sign, exp = 0
  let expBinStr, fracBinStr
  let fracLength

  if (Number.isNaN(num)) return generateNaNOrInfinity('NaN', type)

  if (type === 'float32') {
    expLength = FLOAT32_EXP_LENGTH
    fracLength = FLOAT32_FRAC_LENGTH
  } else if (type === 'float64') {
    expLength = FLOAT64_EXP_LENGTH
    fracLength = FLOAT64_FRAC_LENGTH
  }

  sign = getSign(num)
  if (num < 0) num *= -1

  const flag = detectOverflow(num, type)
  if (flag === 'Overflow') return generateNaNOrInfinity('Infinity', type, sign)
  else if (flag === 'Underflow') return calculateIEEEForm(sign * 0, type);

  const numBinStr = num.toString(2)
  // get the value of the exponent part
  if (num >= 1) exp = numBinStr.length - 1
  else if (num === 0 && type === 'float32') exp = -127
  else if (num === 0 && type === 'float64') exp = -1023
  else {
    for (let char of numBinStr) {
      if (char === '0') exp--
      else if (char === '.') continue
      else if (char === '1') break
    }
  }

  // get the bit string of the fraction part
  let fracBeginPos = 0
  for (let char of numBinStr) {
    fracBeginPos++
    if (char == '1') break
  }

  expBinStr = handleIEEE754Exp(exp, type)
  fracBinStr = numBinStr.slice(fracBeginPos)

  while (fracBinStr.length < fracLength) {
    fracBinStr = fracBinStr + '0'
  }
  if (fracBinStr.length > fracLength) {
    fracBinStr = fracBinStr.slice(0, fracLength)
  }

  return [String(sign), expBinStr, fracBinStr]
}
