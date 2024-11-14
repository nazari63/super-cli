import { parse_toml } from '@/toml_parser.js'

export const parseTOML = (tomlString: string) => {
    const jsonStr = parse_toml(tomlString)
    return JSON.parse(jsonStr)
}
