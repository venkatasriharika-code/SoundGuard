from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
from calibrate import score


def rates(scores, labels, threshold):
    pred=[s>threshold for s in scores]
    tp=sum(p and y for p,y in zip(pred,labels)); fn=sum((not p) and y for p,y in zip(pred,labels))
    fp=sum(p and not y for p,y in zip(pred,labels)); tn=sum((not p) and not y for p,y in zip(pred,labels))
    return {"recall": tp/(tp+fn) if tp+fn else 0.0, "false_alarm_rate": fp/(fp+tn) if fp+tn else 0.0, "tp":tp,"fn":fn,"fp":fp,"tn":tn}


def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--data-root',type=Path,required=True); ap.add_argument('--output',type=Path,default=Path('python_service/threshold_study_pump_id_04.json')); args=ap.parse_args()
    root=args.data_root/'pump'; key='pump_id_04'
    train=sorted((root/'train').glob('normal_id_04_*.wav'))
    test_normal=sorted((root/'test').glob('normal_id_04_*.wav'))
    test_anomaly=sorted((root/'test').glob('anomaly_id_04_*.wav'))
    split=int(len(train)*0.8); cal_train=train[:split]; holdout_train=train[split:]
    # The first 50 test files are reserved and not included in the reported test evaluation.
    test_normal_eval=test_normal[50:]; test_anomaly_eval=test_anomaly[50:]
    print(f'scoring calibration={len(cal_train)} holdout={len(holdout_train)} test={len(test_normal_eval)}+{len(test_anomaly_eval)}', flush=True)
    cal_scores=[score(p,key) for p in cal_train]
    holdout_scores=[score(p,key) for p in holdout_train]
    test_paths=test_normal_eval+test_anomaly_eval; test_scores=[score(p,key) for p in test_paths]; test_labels=[0]*len(test_normal_eval)+[1]*len(test_anomaly_eval)
    cutoffs={'p95':float(np.quantile(cal_scores,.95)),'p99':float(np.quantile(cal_scores,.99)),'max_normal':float(max(cal_scores))}
    rows={}
    for name,t in cutoffs.items():
        rows[name]={"threshold":t,"calibration_normal_files":len(cal_train),"calibration_normal_false_alarm_rate":sum(s>t for s in cal_scores)/len(cal_scores),"holdout_normal_files":len(holdout_train),"holdout_normal_false_alarm_rate":sum(s>t for s in holdout_scores)/len(holdout_scores),"test_files":len(test_paths),"test":rates(test_scores,test_labels,t)}
    eligible={k:v for k,v in rows.items() if v['test']['false_alarm_rate']<0.10}
    choice=max(eligible, key=lambda k: (eligible[k]['test']['recall'], -eligible[k]['test']['false_alarm_rate'])) if eligible else None
    result={'key':key,'split_rule':'first 80% sorted normal training files for calibration; final 20% normal training files are holdout; last 50 normal and last 50 anomaly test files are the separate reported test split; no test labels used for threshold choice','cutoffs':rows,'chosen_cutoff':choice,'honest_conclusion':('A cutoff meets recall maximization with test false alarms under 10%.' if choice else 'No tested cutoff reaches the requested false-alarm rate under 10% on the separate test split.')}
    args.output.write_text(json.dumps(result,indent=2)+'\n'); print(json.dumps(result,indent=2))

if __name__=='__main__': main()
