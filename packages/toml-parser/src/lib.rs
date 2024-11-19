use std::collections::HashMap;

use napi::bindgen_prelude::*;
use napi_derive::napi;

use toml;
use serde_json;

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
