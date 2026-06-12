import 'server-only';
import { END, START, StateGraph } from '@langchain/langgraph';
import { getCheckpointer } from './checkpointer';
import {
  agentNode,
  confirmGateNode,
  readToolsNode,
  routeAfterAgent,
  routeAfterConfirmGate,
  routeAfterReadTools,
} from './nodes';
import { AssistantGraphState } from './state';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let compiled: any = null;

export async function getAssistantGraph() {
  if (compiled) return compiled;

  const checkpointer = await getCheckpointer();

  const graph = new StateGraph(AssistantGraphState)
    .addNode('agent', agentNode)
    .addNode('read_tools', readToolsNode)
    .addNode('confirm_gate', confirmGateNode)
    .addEdge(START, 'agent')
    .addConditionalEdges('agent', routeAfterAgent, {
      read_tools: 'read_tools',
      confirm_gate: 'confirm_gate',
      __end__: END,
    })
    .addConditionalEdges('read_tools', routeAfterReadTools, {
      confirm_gate: 'confirm_gate',
      agent: 'agent',
    })
    .addConditionalEdges('confirm_gate', routeAfterConfirmGate, {
      confirm_gate: 'confirm_gate',
      agent: 'agent',
    });

  compiled = graph.compile({ checkpointer });
  return compiled;
}
