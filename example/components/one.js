import * as constant from '../libs/constants.js';
import two from './two.js';

export function one() {
  console.log('constant: ', constant.APPLE, constant.ORANGE);
  two();
}
