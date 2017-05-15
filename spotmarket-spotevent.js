'use strict';

module.exports = function(Spotmarketspotevent) {
	
	var mongojs = require('mongojs');//for define db
	var mongo = require('mongodb');//for convert srting to mongodb object
	var db = mongojs('SpotMarket_database',['spotmarket_spotevent'],['spotmarket_farmer_particapate']);

		//search spot remoe query -----------//
	Spotmarketspotevent.remoteMethod('SearchSpot', 
        {
          accepts: [
					{arg: 'latitude', type: 'number', required:true},//--------latitude of users////////////
					{arg: 'longitude', type: 'number', required:true}//------longitude of users------------//
		  		   ],
		  returns: [
			  		{arg: 'data', type: ['matched'],root:true} //-------arg in response------//
		  		   ]
        });

	//----------functionality of above  ----------------//
		Spotmarketspotevent.SearchSpot=function(latitude,longitude,cb)
		{
			
			db.spotmarket_spotevent.aggregate([
			{
			"$match": { loc: { $geoWithin: { $centerSphere: [ [ longitude, latitude ] ,
            50 / 3963.2 ] } }, "IsActive":1 }
			},
			{ $lookup: {from: "spotmarket_farmer_particapate", localField: "_id", foreignField: "spot_market_id", as: "link"} },
			{ $unwind: {
				path: "$link",
				preserveNullAndEmptyArrays: true
			  }},
			
			{ $lookup: {from: "spotmarket_farmers", localField: "link.farmer_id", foreignField: "_id", as: "link.farmers_info"} }, {
			  $group: {
				_id : "$_id",
				title: { $first: "$title" },
				address: { $first: "$address" },
				loc: { $first: "$loc" },
				date: { $first: "$date" },
				time: { $first: "$time" },
				any_details: { $first: "$any_details" },
				lastUpdated: { $first: "$lastUpdated" },
				IsActive: { $first: "$IsActive" },
				image_url: { $first: "$image_url" },
				link: { $push: "$link" }
				}
				}, {
			  $project: {
				_id: 1,
				title: 1,
				address: 1,
				loc: 1,
				date: 1,
				time: 1,
				any_details: 1,
				lastUpdated: 1,
				IsActive: 1,
				image_url: 1,
				link: {
				  $filter: { input: "$link", as: "a", cond: { $ifNull: ["$$a._id", false] } }
				} 
			  }
			}
			],function(err,data){
				//console.log(data);
				if(data.length == 0 ){
			
					var er=new Error("No spot near you");
					er.status=415;
					cb(er,null);
					return;
				}else{
					cb(null,data);
					return;
				}
			});
		};
};
