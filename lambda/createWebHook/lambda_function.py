import json, boto3, os, json, copy
from botocore.vendored import requests
"""
input: {org, repo, location, projectName}
output: {org, repo, location, projectName, hook_result}
"""
def lambda_handler(event, context):
    codebuild = boto3.client('codebuild')
    project = event['projectName']

    # call api to create webhook
    try:
        response = codebuild.create_webhook(projectName=project)
    except:
        # existing. delete and recreate
        codebuild.delete_webhook(projectName=project)
        response = codebuild.create_webhook(projectName=project)
    
    webhook = response['webhook']
    
    # Get token
    sm = boto3.client('secretsmanager')
    secretName = os.environ['SECRET_NAME']
    result = sm.get_secret_value(SecretId=secretName)
    
    secretsStore = json.loads(result['SecretString'])
    usr = secretsStore['GITEE_USER_NAME']
    token = secretsStore['GITEE_ACCESS_TOKEN']
    
    hooks_url = event['hooks_url']
    payload = '''{
        "name": "web",
        "active": true,
        "events": [
            "push",
            "pull_request"
        ],
        "config": {
            "url": "",
            "content_type": "json",
            "secret": ""
        }
    }'''
    payload = json.loads(payload)
    payload['config']['url'] = webhook['payloadUrl']
    payload['config']['secret'] = webhook['secret']

    # call github ee webhook to create webhook
    r = requests.post(hooks_url, auth=(usr, token), json=payload, verify=False)
    if r.status_code != 201:
        raise Exception(r.json())
    res = copy.deepcopy(event)
    res_from_git = r.json()
    res['hook_result'] = res_from_git['url']
    return res