# openwhisk-jq
OpenWhisk Action wrapping the [JQ command-line utility](https://stedolan.github.io/jq/) for JSON filtering.

This Action allows you to [create sequences](https://github.com/openwhisk/openwhisk/blob/master/docs/actions.md#creating-action-sequences) 
that join Actions whose output and input parameters don't match. The JQ utility is used to filter the output from
one Action to match the input expected by another.

# deployment 

This Action is available on Docker Hub at the 
[jamesthomas/openwhisk-jq](https://hub.docker.com/r/jamesthomas/openwhisk-jq/)
repository.

OpenWhisk can create Actions from Docker Hub images using the command below.

```
wsk action create --docker jq jamesthomas/openwhisk-jq
```

# invoking 

This OpenWhisk Action runs the JQ utility, using the JSON parameters that were
used to invoke the Action as input. The Action expects the _jq_ parameter to
contain the filter string to process the JSON input. This parameter is removed
from the JSON before it is passed to the Action.

This example demonstrates invoking the Action with the simplest filter that 
returns the JSON input without modification.

```
wsk action invoke --blocking --result jq --param jq '.' --param message "Hello world"
{
    "message": "Hello world"
}
```

# invoking in sequences

This Action will normally be used as part of an Action sequence, to transform
the output from one Action to match the input parameters expected by another.

Binding the _jq_ parameter to the Action before creating a sequence means we
don't have to pass this parameter during the Action invocation.

```
wsk action update jq --param jq '...'
wsk action create my_sequence --sequence /ns/action,/ns/jq,/ns/another_action
wsk action invoke --result --blocking my_sequence
```

For example, given one Action that returns a message...

```
wsk action invoke sample --blocking --result
{
    "payload": "Hello, my name is James"
}
```

...and another that reverses words in a sentence.

```
wsk action invoke reverse --blocking --result --param text "Hello my name is James"
{
    "reversed": "James is name my Hello"
}
```

We can create a new Action, which reverses the message, using the JQ Action
to map the output parameter (_payload_) to the expected input parameter (_text_).

```
wsk action update jq --param jq ". | {text: .payload}"
wsk action create reverse_sample --sequence /namespace/sample,/namespace/jq,/namespace/reverse
wsk action invoke reverse_sample --blocking --result
{
    "reversed": "James is name my Hello,"
}
```

# customising

The ```index.js``` file contains the Node.js script that calls JQ command-line
utility, passing the Action parameters without the _jq_ property to to
```stdio```. JSON returned through ```stdout``` is used as the Action result.

The [Alpine Linux Node.js image](https://github.com/mhart/alpine-node) is used to build a custom Docker image, which
installs the JQ utility during the Docker build process.

Use the following commands to build a custom JQ Action, push to Dockerhub and 
then expose as an OpenWhisk Action.

```
docker build -t openwhisk-jq .
docker tag openwhisk-jq <dockerhub_username>/openwhisk-jq
docker push <dockerhub_username>/openwhisk-jq
wsk action create --docker jq <dockerhub_username>/openwhisk-jq
```
