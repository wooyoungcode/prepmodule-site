async function request(path,options){
  const response=await fetch(path,options),result=await response.json();
  if(!response.ok){const error=new Error(result.error||'요청 처리 중 오류가 발생했습니다.');error.status=response.status;throw error;}
  return result;
}
export async function createTransport(){
  const config=window.PREPMODULE_CONFIG||{};
  if(config.mode==='cloud'||!['localhost','127.0.0.1'].includes(location.hostname)){
    const {createCloudTransport}=await import('./cloud-client.js');return createCloudTransport(config);
  }
  return {mode:'local',configured:true,init:async()=>null,session:()=>null,
    getState:month=>request(`/api/state?month=${month}`),
    preview:(month,kind,personId,sourceId)=>request(`/api/preview?month=${month}&kind=${kind}&personId=${encodeURIComponent(personId)}${sourceId?'&sourceDocumentId='+sourceId:''}`),
    post:(route,data,month)=>request(`/api/${route}?month=${month}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),
    getFileUrl:async id=>`/api/files/${id}`,backup:async()=>request('/api/backup'),
    subscribe:()=>()=>{},signOut:async()=>{},onSession:()=>()=>{}
  };
}
