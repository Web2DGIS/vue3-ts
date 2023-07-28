import cd from './cd.json'
import beijing from './beijing.json'
import file from './file.json'
import duSuri from './Du_Suri.json'
import canu from './Canu.json'

export { cd, beijing, file }

export const geojson = [...cd.features]

export const typhoon = [duSuri, canu]

export const typhoonLevel = {
  台风: '#FF9800',
  强台风: '#E91E63',
  超强台风: '#D50000',
  热带风暴: '#3F51B5',
  强热带风暴: '#FFC107',
}
