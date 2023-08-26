'use strict';

var fs = require('fs');
var child_process = require('child_process');

let intervalHandler;
async function register(api) {
    api.communication.logInfo("Setting up plex anilist sync");
    const pythonTest = child_process.spawnSync(`python3`);
    if (pythonTest.error) {
        api.communication.logError(`Could not register plex anilist sync, python3 does not seem to be installed or does not work correctly. ${pythonTest.error?.toString()}`);
        return;
    }

    const pipTest = child_process.spawnSync(`pip`);
    if (pipTest.error) {
        api.communication.logError(`Could not register plex anilist sync, pip does not seem to be installed or does not work correctly. ${pipTest.error?.toString()}`);
        return;
    }

    const plexAniSyncMasterPath = `${api.thisPluginDirectory}/PlexAniSync-master`;
    if (!fs.existsSync(plexAniSyncMasterPath)) {
        api.communication.logInfo(`Loading PlexAniSync from https://github.com/RickDB/PlexAniSync/archive/master.zip`);
        await api.downloadPluginResourceZipAndUnzip(api.thisPluginDirectory, "https://github.com/RickDB/PlexAniSync/archive/master.zip");
        api.communication.logInfo(`Download complete.`);
        api.communication.logInfo(`Installing dependencies...`);
        const result = child_process.spawnSync('pip', ['install', '-r', 'requirements.txt'], {cwd: plexAniSyncMasterPath});
        if (result.status !== 0) {
            fs.rmSync(plexAniSyncMasterPath, {recursive: true, force: true});
            throw new Error(`Error while installing dependencies for anilist sync ${result.stderr?.toString()}`)
        }
        fs.writeFileSync(`${plexAniSyncMasterPath}/settings.ini`, getPlexAniSyncTemplate({}));
        api.communication.logInfo(`Done. Plex anilist sync good to go!`);
    }
    api.communication.logInfo("Plex anilist sync setup complete.");
}

function syncAniList(api) {
    const plexAniSyncMasterPath = `${api.thisPluginDirectory}/PlexAniSync-master`;
    let logs = "";
    api.communication.logInfo(`Trying to sync to anilist.`);

    const process = child_process.spawn('python3', ["PlexAniSync.py"], { cwd: plexAniSyncMasterPath });

    process.stdout.on('data', (data) => {
        logs += data?.toString();
    });

    process.stderr.on('data', (data) => {
        logs += data?.toString();
    });

    process.on('error', (error) => {
        api.communication.logError(`Could not sync to anilist: ${error.message}`);
    });

    process.on('exit', (code) => {
        if (code === 0) {
            api.communication.logInfo(`Anilist sync done.`);
            fs.writeFileSync(`${api.thisPluginDirectory}/info.log`, logs);
        } else {
            api.communication.logError(`Error while syncing to anilist. For more information see "${api.thisPluginDirectory}/error.log"`);
            fs.writeFileSync(`${api.thisPluginDirectory}/error.log`, logs);
        }
    });
}


async function onConfigUpdate(api, config) {
    fs.writeFileSync(`${api.thisPluginDirectory}/PlexAniSync-master/settings.ini`, getPlexAniSyncTemplate(config));
    if (intervalHandler) {
        clearInterval(intervalHandler);
    }
    syncAniList(api);
    intervalHandler = setInterval(() => syncAniList(api), 1000*60*config.sync_interval_in_minutes);
}

function getPlexAniSyncTemplate(config) {
    const directConf = `authentication_method = direct
base_url = ${config.base_url}
token = ${config.token}`;
    const myPlexConf = `authentication_method = myplex
server = ${config.server}
myplex_user = ${config.myplex_user}
myplex_token = ${config.myplex_token}`;
    const homeUserSyncConf = `home_user_sync = True
home_username = ${config.home_username}
home_server_base_url = ${config.home_server_base_url}`;

    return `[PLEX]
anime_section = ${config.anime_section}
${config.authentication_method_direct ? directConf : myPlexConf}
${config.home_user_sync ? homeUserSyncConf : ''}

[ANILIST]
access_token = ${config.access_token}
plex_episode_count_priority = ${config.plex_episode_count_priority ? 'True' : 'False'}
skip_list_update = ${config.skip_list_update ? 'True' : 'False'}
username = ${config.username}
log_failed_matches = ${config.log_failed_matches ? 'True' : 'False'}
sync_ratings = ${config.sync_ratings ? 'True' : 'False'}
`
}

var index = {
    "name": "plex-anilist-sync",
    "version": "0.1",
    "description": "Plugin to automatically periodically sync your plex server with https://anilist.co/ \nYou need to install python 3 and pip in your system and have them in the PATH variable for this plugin to function properly. \n See here for a guide on how to configure this: https://github.com/RickDB/PlexAniSync",
    register,
    onConfigUpdate,
    pluginConfigurationDefinition: [
        {label: 'Plugin settings', type: 'label'},
        {key: 'sync_interval_in_minutes', type: 'number', default: 15},
        {label: 'Plex settings', type: 'label'},
        {key: 'anime_section', type: 'text', default: 'Anime|Season'},
        {key: 'authentication_method_direct', type: 'boolean', default: true},
        {key: 'base_url', type: 'text', default: '', enableWhen: {key: 'authentication_method_direct', is: true}},
        {key: 'token', type: 'text', default: '', enableWhen: {key: 'authentication_method_direct', is: true}},
        {key: 'server', type: 'text', default: '', enableWhen: {key: 'authentication_method_direct', is: false}},
        {key: 'myplex_user', type: 'text', default: '', enableWhen: {key: 'authentication_method_direct', is: false}},
        {key: 'myplex_token', type: 'text', default: '', enableWhen: {key: 'authentication_method_direct', is: false}},
        {key: 'home_user_sync', type: 'boolean', default: false},
        {key: 'home_username', type: 'text', default: '', enableWhen: {key: 'home_user_sync', is: true}},
        {key: 'home_server_base_url', type: 'text', default: '', enableWhen: {key: 'home_user_sync', is: true}},
        {label: 'Anilist.co settings', type: 'label'},
        {key: 'access_token', type: 'text', default: ''},
        {key: 'plex_episode_count_priority', type: 'boolean', default: false},
        {key: 'skip_list_update', type: 'boolean', default: false},
        {key: 'username', type: 'text', default: ''},
        {key: 'log_failed_matches', type: 'boolean', default: false},
        {key: 'sync_ratings', type: 'boolean', default: false}
    ]
};

module.exports = index;
