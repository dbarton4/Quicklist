/* QuickList sale workflow. No marketplace adapter is connected in this release.
   A server can call processConfirmedSale with verified events and authorized adapters.
   Never treat a manual/demo event as marketplace verification. */
(function(root){
  const MARKETS=['ebay','depop','mercari'];
  async function processConfirmedSale({item,event,adapters={},seenEvents=new Set()}){
    if(!item||!event||!event.id||!MARKETS.includes(event.marketplace)||!event.verified){
      throw new Error('A verified marketplace sale event and matching item are required');
    }
    if(seenEvents.has(event.id))return {duplicate:true,item,results:[]};
    if(item.sale?.eventId && item.sale.eventId!==event.id){
      return {conflict:true,item,results:[],message:'Item already has a different recorded sale; review immediately'};
    }
    const updated={...item,status:{...item.status,[event.marketplace]:'sold'},sale:{eventId:event.id,marketplace:event.marketplace,confirmedAt:event.confirmedAt||Date.now(),verified:true}};
    const results=[];
    for(const market of MARKETS.filter(m=>m!==event.marketplace)){
      const listingId=item.listingIds?.[market];
      if(!listingId || item.status?.[market]!=='listed'){
        results.push({marketplace:market,status:'not-applicable',detail:'No verified active listing ID'});continue;
      }
      const adapter=adapters[market];
      if(!adapter||typeof adapter.endListing!=='function'){
        results.push({marketplace:market,status:'manual-required',detail:'Authorized delisting connection unavailable'});continue;
      }
      try{
        const response=await adapter.endListing({listingId,itemId:item.id,saleEventId:event.id});
        if(response?.confirmed===true){updated.status[market]='delisted';results.push({marketplace:market,status:'delisted',detail:'Marketplace confirmed removal'});}
        else results.push({marketplace:market,status:'failed',detail:'Marketplace did not confirm removal'});
      }catch(error){results.push({marketplace:market,status:'failed',detail:String(error?.message||'Request failed')});}
    }
    updated.delistingResults=results;
    seenEvents.add(event.id);
    return {item:updated,results,duplicate:false};
  }
  root.QuickListSoldSync={processConfirmedSale,MARKETS};
  if(typeof module!=="undefined"&&module.exports)module.exports={processConfirmedSale,MARKETS};
})(typeof module!=='undefined'&&module.exports?module.exports:globalThis);
