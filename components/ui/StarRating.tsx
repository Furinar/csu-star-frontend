export default function StarRating({score,size="10px"}:{score:number, size?:string})
{
    const fillWidth=`${(score/5)*100}%`;
    return(
        <div className="star-rating relative text-gray-400 leading-none inline-block" style={{fontSize:size||"10px"}}>
            <i className="fa fa-star"/>
            <i className="fa fa-star"/>
            <i className="fa fa-star"/>
            <i className="fa fa-star"/>
            <i className="fa fa-star"/>
            <div className="star-fill absolute top-0 left-0 text-[#ffb400] h-full overflow-hidden" style={{width:fillWidth}}>
                <i className="fa fa-star"/>
                <i className="fa fa-star"/>
                <i className="fa fa-star"/>
                <i className="fa fa-star"/>
                <i className="fa fa-star"/>
            </div>
        </div>
    )
}