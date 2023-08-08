import cd from './cd.json'
import beijing from './beijing.json'
import file from './file.json'
import duSuri from './Du_Suri.json'
import canu from './Canu.json'

export { cd, beijing, file }

export const geojson = [...cd.features]

export const typhoon = [duSuri, canu]
