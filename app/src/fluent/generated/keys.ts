import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    'auto-priority-from-impact-urgency': {
                        table: 'sys_script'
                        id: 'f59a08c28a4d493d88c8fafc90d3328d'
                    }
                    bom_json: {
                        table: 'sys_module'
                        id: '782c948b707f4b4fa781cfacfb1d3da3'
                    }
                    br0: {
                        table: 'sys_script'
                        id: '35fb4e7b6c8b48a1831bc597a2438ee0'
                    }
                    cs0: {
                        table: 'sys_script_client'
                        id: '190156e9d57f419e8afa09e168c2ee1a'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'c4f8f8c420884218b02dbfbfc80f16e3'
                    }
                    'src_server_calculate-priority_ts': {
                        table: 'sys_module'
                        id: '9120fd23c47547bb9a41a3cb9197d060'
                    }
                    src_server_script_ts: {
                        table: 'sys_module'
                        id: 'ca4bfaffb3d844d98f13d92e5c955207'
                    }
                    'src_server_vip-caller-flag_ts': {
                        table: 'sys_module'
                        id: '458ef72407454e50bd6460787726a651'
                    }
                    'vip-caller-auto-flag': {
                        table: 'sys_script'
                        id: '293da476061b41edad340a68827736a9'
                    }
                }
            }
        }
    }
}
