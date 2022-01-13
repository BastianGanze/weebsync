[![Build/release](https://github.com/BastianGanze/weebsync/actions/workflows/main.yml/badge.svg)](https://github.com/BastianGanze/weebsync/actions/workflows/main.yml)

# Example Config

`syncOnStart` and `autoSyncIntervalInMinutes` are optional. Default values below.

```json
{
  "syncOnStart": true,
  "autoSyncIntervalInMinutes": 30,
    "server": {
        "host": "",
        "port": 21,
        "user": "",
        "password": ""
    },
    "syncMaps": [
        {
            "originFolder": "",
            "destinationFolder": "",
            "fileRegex": "",
            "fileRenameTemplate": ""
        }
    ]
}
```
