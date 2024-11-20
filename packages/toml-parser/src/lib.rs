use std::collections::HashMap;

use napi::bindgen_prelude::*;
use napi_derive::napi;

use serde_json;
use toml;

type TomlContent = HashMap<String, toml::value::Value>;

#[napi]
pub fn parse_toml(toml_str: String) -> Result<String> {
    let parsed = toml::from_str::<TomlContent>(&toml_str);

    match parsed {
        Ok(data) => {
            let json_str = serde_json::to_string(&data)
                .map_err(|e| napi::Error::new(napi::Status::InvalidArg, &e.to_string()))?;
            Ok(json_str)
        }
        Err(e) => {
            let err = napi::Error::new(napi::Status::InvalidArg, &e.to_string());
            Err(err)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn can_parse_toml() {
        let toml_str = r#"
            [testcli]
            test_key = "test"

            [testcli.test_nested]
            test_arr = [1, 2, 3]
        "#
        .to_string();
        let result = parse_toml(toml_str);
        assert_eq!(result.is_ok(), true);
        assert_eq!(
            result.unwrap(),
            r#"{"testcli":{"test_key":"test","test_nested":{"test_arr":[1,2,3]}}}"#
        );
    }
}
